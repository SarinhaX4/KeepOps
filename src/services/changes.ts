import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type ChangeStatus = Enums<'change_status'>;

export type ChangeListItem = Tables<'changes'> & {
  apps: Pick<Tables<'applications'>, 'id' | 'short_name'>[];
};

export type NewChangeInput = {
  changeNumber: string;
  title: string;
  description: string | null;
  windowStart: Date;
  windowEnd: Date;
  executorTeam: string | null;
  executorContact: string | null;
  applicationIds: string[];
};

export async function listChanges(): Promise<ChangeListItem[]> {
  const { data, error } = await supabase
    .from('changes')
    .select('*, change_applications(applications(id, short_name))')
    .order('window_start', { ascending: false });
  if (error) throw new Error(`Erro ao carregar GMUDs: ${error.message}`);

  return data.map(({ change_applications, ...change }) => ({
    ...change,
    apps: change_applications
      .map((ca) => ca.applications)
      .filter((a): a is NonNullable<typeof a> => a !== null),
  }));
}

/**
 * Creates the change and links its applications.
 * The database trigger then copies each application's validation script into `validations`.
 */
export async function createChange(input: NewChangeInput, userId: string, teamId: string) {
  const { data: change, error } = await supabase
    .from('changes')
    .insert({
      team_id: teamId,
      change_number: input.changeNumber,
      title: input.title,
      description: input.description,
      window_start: input.windowStart.toISOString(),
      window_end: input.windowEnd.toISOString(),
      executor_team: input.executorTeam,
      executor_contact: input.executorContact,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      throw new Error(`Já existe uma GMUD com o número ${input.changeNumber}.`);
    throw new Error(`Erro ao criar GMUD: ${error.message}`);
  }

  const { error: linkError } = await supabase.from('change_applications').insert(
    input.applicationIds.map((applicationId) => ({
      change_id: change.id,
      application_id: applicationId,
    })),
  );
  if (linkError)
    throw new Error(`GMUD criada, mas falhou ao vincular aplicações: ${linkError.message}`);

  return change;
}

export type ChangeDetail = Tables<'changes'> & {
  apps: (Pick<Tables<'applications'>, 'id' | 'name' | 'short_name'> & {
    steps: Pick<
      Tables<'validations'>,
      'id' | 'step_title' | 'position' | 'result' | 'note' | 'performed_at'
    >[];
  })[];
  events: (Pick<
    Tables<'change_events'>,
    'id' | 'from_status' | 'to_status' | 'note' | 'changed_at'
  > & {
    by: string | null;
  })[];
  incidents: Pick<
    Tables<'incidents'>,
    'id' | 'title' | 'severity' | 'status' | 'external_ticket' | 'opened_at' | 'resolved_at'
  >[];
  checks: (Pick<
    Tables<'health_checks'>,
    'id' | 'application_id' | 'phase' | 'http_status' | 'latency_ms' | 'ok' | 'checked_at'
  > & { by: string | null })[];
};

export async function getChange(id: string): Promise<ChangeDetail> {
  const [changeRes, valRes, evRes, incRes, checkRes] = await Promise.all([
    supabase
      .from('changes')
      .select('*, change_applications(applications(id, name, short_name))')
      .eq('id', id)
      .single(),
    supabase
      .from('validations')
      .select('id, application_id, step_title, position, result, note, performed_at')
      .eq('change_id', id)
      .order('position'),
    supabase
      .from('change_events')
      .select('id, from_status, to_status, note, changed_at, profiles(full_name)')
      .eq('change_id', id)
      .order('changed_at'),
    supabase
      .from('incidents')
      .select('id, title, severity, status, external_ticket, opened_at, resolved_at')
      .eq('change_id', id)
      .order('opened_at'),
    supabase
      .from('health_checks')
      .select(
        'id, application_id, phase, http_status, latency_ms, ok, checked_at, profiles(full_name)',
      )
      .eq('change_id', id)
      .order('checked_at'),
  ]);
  if (changeRes.error) throw new Error(`GMUD não encontrada: ${changeRes.error.message}`);
  if (valRes.error) throw new Error(`Erro ao carregar checklist: ${valRes.error.message}`);
  if (evRes.error) throw new Error(`Erro ao carregar histórico: ${evRes.error.message}`);
  if (incRes.error) throw new Error(`Erro ao carregar ocorrências: ${incRes.error.message}`);
  if (checkRes.error) throw new Error(`Erro ao carregar health checks: ${checkRes.error.message}`);

  const { change_applications, ...change } = changeRes.data;
  return {
    ...change,
    apps: change_applications
      .map((ca) => ca.applications)
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => ({
        ...a,
        steps: valRes.data
          .filter((v) => v.application_id === a.id)
          .map(({ application_id: _omit, ...step }) => step),
      })),
    events: evRes.data.map(({ profiles, ...e }) => ({ ...e, by: profiles?.full_name ?? null })),
    incidents: incRes.data,
    checks: checkRes.data.map(({ profiles, ...c }) => ({ ...c, by: profiles?.full_name ?? null })),
  };
}

/**
 * Updates the change and syncs its applications.
 * Triggers: adding an app creates its checklist; removing one deletes only pending steps.
 */
export async function updateChange(id: string, input: NewChangeInput, currentAppIds: string[]) {
  const { error } = await supabase
    .from('changes')
    .update({
      change_number: input.changeNumber,
      title: input.title,
      description: input.description,
      window_start: input.windowStart.toISOString(),
      window_end: input.windowEnd.toISOString(),
      executor_team: input.executorTeam,
      executor_contact: input.executorContact,
    })
    .eq('id', id);
  if (error) {
    if (error.code === '23505')
      throw new Error(`Já existe uma GMUD com o número ${input.changeNumber}.`);
    throw new Error(`Erro ao salvar GMUD: ${error.message}`);
  }

  const toAdd = input.applicationIds.filter((a) => !currentAppIds.includes(a));
  const toRemove = currentAppIds.filter((a) => !input.applicationIds.includes(a));
  if (toAdd.length) {
    const { error: addError } = await supabase
      .from('change_applications')
      .insert(toAdd.map((application_id) => ({ change_id: id, application_id })));
    if (addError) throw new Error(`Erro ao vincular aplicações: ${addError.message}`);
  }
  if (toRemove.length) {
    const { error: rmError } = await supabase
      .from('change_applications')
      .delete()
      .eq('change_id', id)
      .in('application_id', toRemove);
    if (rmError) throw new Error(`Erro ao desvincular aplicações: ${rmError.message}`);
  }
}

/** Status transition; the database logs it in change_events. */
export async function setChangeStatus(id: string, status: ChangeStatus, note?: string) {
  const { error } = await supabase
    .from('changes')
    .update({ status, ...(note !== undefined ? { conclusion_note: note } : {}) })
    .eq('id', id);
  if (error) throw new Error(`Não foi possível mudar o status: ${error.message}`);
}
