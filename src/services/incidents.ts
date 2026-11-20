import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type Severity = Enums<'incident_severity'>;
export type IncidentStatus = Enums<'incident_status'>;
export type IncidentEventKind = Enums<'incident_event_kind'>;

export type IncidentListItem = Tables<'incidents'> & {
  appName: string | null;
  appShortName: string | null;
  changeNumber: string | null;
  unansweredCalls: number;
};

export type IncidentEvent = Tables<'incident_events'> & { by: string | null };

export type IncidentDetail = IncidentListItem & {
  openerName: string | null;
  events: IncidentEvent[];
};

const LIST_SELECT =
  '*, applications(name, short_name), changes(change_number), incident_events(kind, responded_at)';

type Row = Tables<'incidents'> & {
  applications: { name: string; short_name: string } | null;
  changes: { change_number: string } | null;
  incident_events: { kind: IncidentEventKind; responded_at: string | null }[];
};

function toItem({ applications, changes, incident_events, ...i }: Row): IncidentListItem {
  return {
    ...i,
    appName: applications?.name ?? null,
    appShortName: applications?.short_name ?? null,
    changeNumber: changes?.change_number ?? null,
    unansweredCalls: incident_events.filter((e) => e.kind === 'acionamento' && !e.responded_at)
      .length,
  };
}

export async function listIncidents(): Promise<IncidentListItem[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(LIST_SELECT)
    .order('opened_at', { ascending: false });
  if (error) throw new Error(`Erro ao carregar ocorrências: ${error.message}`);
  return data.map(toItem);
}

export async function getIncident(id: string): Promise<IncidentDetail> {
  const [incRes, evRes] = await Promise.all([
    supabase
      .from('incidents')
      .select(`${LIST_SELECT}, opener:profiles!incidents_opened_by_fkey(full_name)`)
      .eq('id', id)
      .single(),
    supabase
      .from('incident_events')
      .select('*, profiles(full_name)')
      .eq('incident_id', id)
      .order('created_at'),
  ]);
  if (incRes.error) throw new Error(`Ocorrência não encontrada: ${incRes.error.message}`);
  if (evRes.error) throw new Error(`Erro ao carregar linha do tempo: ${evRes.error.message}`);

  const { opener, ...row } = incRes.data;
  return {
    ...toItem(row),
    openerName: opener?.full_name ?? null,
    events: evRes.data.map(({ profiles, ...e }) => ({ ...e, by: profiles?.full_name ?? null })),
  };
}

export type NewIncident = {
  title: string;
  severity: Severity;
  applicationId: string | null;
  changeId: string | null;
  validationId: string | null;
  externalTicket: string | null;
  description: string | null;
};

export async function createIncident(input: NewIncident, userId: string, teamId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      team_id: teamId,
      title: input.title,
      severity: input.severity,
      application_id: input.applicationId,
      change_id: input.changeId,
      validation_id: input.validationId,
      external_ticket: input.externalTicket,
      opened_by: userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Não foi possível abrir a ocorrência: ${error.message}`);

  const first = input.validationId
    ? `Ocorrência aberta a partir de um passo reprovado.${input.description ? ` ${input.description}` : ''}`
    : (input.description ?? 'Ocorrência aberta.');
  await addIncidentEvent(data.id, { kind: 'nota', description: first }, userId);
  return data.id;
}

export type NewIncidentEvent = {
  kind: IncidentEventKind;
  description: string;
  channel?: string | null;
  contact?: string | null;
};

export async function addIncidentEvent(incidentId: string, ev: NewIncidentEvent, userId: string) {
  const { error } = await supabase.from('incident_events').insert({
    incident_id: incidentId,
    kind: ev.kind,
    description: ev.description,
    channel: ev.channel ?? null,
    contact: ev.contact ?? null,
    created_by: userId,
  });
  if (error) throw new Error(`Não foi possível registrar o evento: ${error.message}`);
}

/** Registering a call moves an "aberta" incident to "em acompanhamento". */
export async function registerCall(
  incidentId: string,
  call: { channel: string; contact: string; description: string; ticket?: string },
  userId: string,
) {
  await addIncidentEvent(
    incidentId,
    {
      kind: 'acionamento',
      description: call.description,
      channel: call.channel,
      contact: call.contact,
    },
    userId,
  );
  const patch: { status: IncidentStatus; external_ticket?: string } = {
    status: 'em_acompanhamento',
  };
  if (call.ticket?.trim()) patch.external_ticket = call.ticket.trim().toUpperCase();
  const { error } = await supabase
    .from('incidents')
    .update(patch)
    .eq('id', incidentId)
    .neq('status', 'resolvida');
  if (error)
    throw new Error(`Acionamento salvo, mas falhou ao atualizar a ocorrência: ${error.message}`);
}

export async function markCallAnswered(eventId: string) {
  const { error } = await supabase
    .from('incident_events')
    .update({ responded_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw new Error(`Não foi possível marcar como respondido: ${error.message}`);
}

export async function resolveIncident(incidentId: string, description: string, userId: string) {
  await addIncidentEvent(incidentId, { kind: 'resolucao', description }, userId);
  const { error } = await supabase
    .from('incidents')
    .update({ status: 'resolvida', resolved_at: new Date().toISOString() })
    .eq('id', incidentId);
  if (error) throw new Error(`Não foi possível resolver: ${error.message}`);
}
