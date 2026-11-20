import { supabase } from '@/lib/supabase';
import type { Enums } from '@/types/database';

export type FollowUpStatus = Enums<'follow_up_status'>;
export type FollowUpSource = Enums<'follow_up_source'>;

export type FollowUpItem = {
  id: string;
  title: string;
  description: string | null;
  status: FollowUpStatus;
  sourceType: FollowUpSource;
  sourceId: string | null;
  /** Human reference of the origin: CHG number or INC ticket. */
  sourceLabel: string | null;
  /** Change to open when the origin is tapped (change or validation origin). */
  sourceChangeId: string | null;
  applicationId: string | null;
  appShortName: string | null;
  appName: string | null;
  shiftKind: Enums<'shift_kind'> | null;
  shiftStartedAt: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  assignedAt: string | null;
  resolutionNote: string | null;
  resolverName: string | null;
  resolvedAt: string | null;
  creatorName: string | null;
  createdAt: string;
};

const SELECT =
  'id, title, description, status, source_type, source_id, application_id, assigned_to, assigned_at, resolution_note, resolved_at, created_at, applications(name, short_name), shifts(kind, started_at), assignee:profiles!follow_ups_assigned_to_fkey(full_name), resolver:profiles!follow_ups_resolved_by_fkey(full_name), creator:profiles!follow_ups_created_by_fkey(full_name)';

/** Resolves CHG/INC labels for each origin in 3 small queries. */
async function resolveSources(rows: { source_type: FollowUpSource; source_id: string | null }[]) {
  const ids = (t: FollowUpSource) =>
    rows.filter((r) => r.source_type === t && r.source_id).map((r) => r.source_id as string);
  const labels = new Map<string, { label: string; changeId: string | null }>();

  const [changes, incidents, validations] = await Promise.all([
    ids('change').length
      ? supabase.from('changes').select('id, change_number').in('id', ids('change'))
      : null,
    ids('incident').length
      ? supabase.from('incidents').select('id, external_ticket, title').in('id', ids('incident'))
      : null,
    ids('validation').length
      ? supabase
          .from('validations')
          .select('id, change_id, changes(change_number)')
          .in('id', ids('validation'))
      : null,
  ]);
  if (changes?.error || incidents?.error || validations?.error) {
    throw new Error('Erro ao carregar a origem das pendências.');
  }
  changes?.data.forEach((c) => labels.set(c.id, { label: c.change_number, changeId: c.id }));
  incidents?.data.forEach((i) =>
    labels.set(i.id, { label: i.external_ticket ?? 'Ocorrência', changeId: null }),
  );
  validations?.data.forEach((v) =>
    labels.set(v.id, { label: v.changes?.change_number ?? 'Validação', changeId: v.change_id }),
  );
  return labels;
}

export async function listFollowUps(options: { includeDone: boolean }): Promise<FollowUpItem[]> {
  let query = supabase.from('follow_ups').select(SELECT).order('created_at', { ascending: false });
  if (!options.includeDone) query = query.neq('status', 'concluida');
  const { data, error } = await query;
  if (error) throw new Error(`Erro ao carregar pendências: ${error.message}`);

  const sources = await resolveSources(data);
  return data.map((f) => {
    const src = f.source_id ? sources.get(f.source_id) : undefined;
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      status: f.status,
      sourceType: f.source_type,
      sourceId: f.source_id,
      sourceLabel: src?.label ?? null,
      sourceChangeId: src?.changeId ?? null,
      applicationId: f.application_id,
      appShortName: f.applications?.short_name ?? null,
      appName: f.applications?.name ?? null,
      shiftKind: f.shifts?.kind ?? null,
      shiftStartedAt: f.shifts?.started_at ?? null,
      assignedTo: f.assigned_to,
      assigneeName: f.assignee?.full_name ?? null,
      assignedAt: f.assigned_at,
      resolutionNote: f.resolution_note,
      resolverName: f.resolver?.full_name ?? null,
      resolvedAt: f.resolved_at,
      creatorName: f.creator?.full_name ?? null,
      createdAt: f.created_at,
    };
  });
}

/** "Assumir": the current user becomes responsible for the follow-up. */
export async function assignFollowUpToMe(followUpId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('follow_ups')
    .update({ assigned_to: userId, assigned_at: new Date().toISOString(), status: 'em_andamento' })
    .eq('id', followUpId);
  if (error) throw new Error(`Não foi possível assumir a pendência: ${error.message}`);
}

/** Concluding requires a note (also enforced by a DB constraint). */
export async function concludeFollowUp(followUpId: string, note: string, userId: string) {
  if (note.trim().length < 3) throw new Error('Descreva o que foi feito para concluir.');
  const { error } = await supabase
    .from('follow_ups')
    .update({
      status: 'concluida',
      resolution_note: note.trim(),
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', followUpId);
  if (error) throw new Error(`Não foi possível concluir a pendência: ${error.message}`);
}

export type NewFollowUp = {
  teamId: string;
  userId: string;
  title: string;
  description: string | null;
  sourceType: FollowUpSource;
  sourceId: string | null;
  applicationId: string | null;
  shiftId: string | null;
};

export async function createFollowUp(f: NewFollowUp): Promise<void> {
  const { error } = await supabase.from('follow_ups').insert({
    team_id: f.teamId,
    title: f.title,
    description: f.description,
    source_type: f.sourceType,
    source_id: f.sourceId,
    application_id: f.applicationId,
    created_in_shift_id: f.shiftId,
    created_by: f.userId,
  });
  if (error) throw new Error(`Não foi possível criar a pendência: ${error.message}`);
}
