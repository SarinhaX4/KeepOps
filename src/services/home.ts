import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';
import { overlaps } from '@/utils/home';
import { shiftDurationHours } from '@/utils/shiftKind';

import { getOpenShift, type Shift } from './shifts';

const HOUR = 3_600_000;

export type HomeChangeApp = {
  id: string;
  name: string;
  shortName: string;
  results: Enums<'validation_result'>[];
  /** Latest post-change health check, if any. */
  lastCheck: Pick<Tables<'health_checks'>, 'http_status' | 'latency_ms' | 'ok'> | null;
};

export type HomeChange = Tables<'changes'> & { apps: HomeChangeApp[] };

export type UnansweredCall = {
  id: string;
  incidentId: string;
  channel: string | null;
  contact: string | null;
  createdAt: string;
  ticket: string | null;
  appName: string | null;
};

export type HomeFollowUp = {
  id: string;
  title: string;
  status: Enums<'follow_up_status'>;
  assignedTo: string | null;
  assigneeName: string | null;
  createdAt: string;
  appShortName: string | null;
  sourceLabel: string | null;
  shiftKind: Enums<'shift_kind'> | null;
  shiftStartedAt: string | null;
};

export type HomeData = {
  shift: Shift | null;
  window: { start: string; end: string };
  changes: HomeChange[];
  calls: UnansweredCall[];
  followUps: HomeFollowUp[];
  openIncidents: number;
};

/** Window shown on the home: the open shift, or today 00:00–24:00 (São Paulo). */
function computeWindow(shift: Shift | null, now: Date) {
  if (shift) {
    const start = new Date(shift.started_at);
    return { start, end: new Date(start.getTime() + shiftDurationHours[shift.kind] * HOUR) };
  }
  const sp = new Date(now.getTime() - 3 * HOUR);
  const start = new Date(Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate(), 3));
  return { start, end: new Date(start.getTime() + 24 * HOUR) };
}

export async function getHomeData(userId: string): Promise<HomeData> {
  const now = new Date();
  const shift = await getOpenShift(userId);
  const win = computeWindow(shift, now);

  const [changesRes, callsRes, followRes, incidentsRes] = await Promise.all([
    supabase
      .from('changes')
      .select('*, change_applications(applications(id, name, short_name))')
      .lt('window_start', win.end.toISOString())
      .gt('window_end', win.start.toISOString())
      .neq('status', 'cancelada')
      .order('window_start'),
    supabase
      .from('incident_events')
      .select(
        'id, incident_id, channel, contact, created_at, incidents!inner(external_ticket, status, applications(name))',
      )
      .eq('kind', 'acionamento')
      .is('responded_at', null)
      .neq('incidents.status', 'resolvida')
      .order('created_at'),
    supabase
      .from('follow_ups')
      .select(
        'id, title, status, assigned_to, created_at, source_type, source_id, applications(short_name), shifts(kind, started_at), assignee:profiles!follow_ups_assigned_to_fkey(full_name)',
      )
      .neq('status', 'concluida')
      .order('created_at'),
    supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'resolvida'),
  ]);

  if (changesRes.error) throw new Error(`Erro ao carregar GMUDs: ${changesRes.error.message}`);
  if (callsRes.error) throw new Error(`Erro ao carregar acionamentos: ${callsRes.error.message}`);
  if (followRes.error) throw new Error(`Erro ao carregar pendências: ${followRes.error.message}`);
  if (incidentsRes.error)
    throw new Error(`Erro ao carregar ocorrências: ${incidentsRes.error.message}`);

  const windowChanges = changesRes.data.filter((c) =>
    overlaps(new Date(c.window_start), new Date(c.window_end), win.start, win.end),
  );
  const changeIds = windowChanges.map((c) => c.id);

  // Checklist results and post-change checks for the window's changes.
  const [valRes, checkRes] = changeIds.length
    ? await Promise.all([
        supabase
          .from('validations')
          .select('change_id, application_id, result')
          .in('change_id', changeIds),
        supabase
          .from('health_checks')
          .select('change_id, application_id, http_status, latency_ms, ok, checked_at')
          .in('change_id', changeIds)
          .eq('phase', 'pos')
          .order('checked_at', { ascending: false }),
      ])
    : [null, null];
  if (valRes?.error) throw new Error(`Erro ao carregar validações: ${valRes.error.message}`);
  if (checkRes?.error) throw new Error(`Erro ao carregar health checks: ${checkRes.error.message}`);

  const changes: HomeChange[] = windowChanges.map(({ change_applications, ...c }) => ({
    ...c,
    apps: change_applications
      .map((ca) => ca.applications)
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => {
        const check = checkRes?.data.find((h) => h.change_id === c.id && h.application_id === a.id);
        return {
          id: a.id,
          name: a.name,
          shortName: a.short_name,
          results: (valRes?.data ?? [])
            .filter((v) => v.change_id === c.id && v.application_id === a.id)
            .map((v) => v.result),
          lastCheck: check
            ? { http_status: check.http_status, latency_ms: check.latency_ms, ok: check.ok }
            : null,
        };
      }),
  }));

  // Change numbers for follow-ups that came from a change.
  const sourceChangeIds = followRes.data
    .filter((f) => f.source_type === 'change' && f.source_id)
    .map((f) => f.source_id as string);
  const numbers = new Map<string, string>();
  if (sourceChangeIds.length) {
    const { data, error } = await supabase
      .from('changes')
      .select('id, change_number')
      .in('id', sourceChangeIds);
    if (error) throw new Error(`Erro ao carregar origem das pendências: ${error.message}`);
    data.forEach((c) => numbers.set(c.id, c.change_number));
  }

  return {
    shift,
    window: { start: win.start.toISOString(), end: win.end.toISOString() },
    changes,
    calls: callsRes.data.map((e) => ({
      id: e.id,
      incidentId: e.incident_id,
      channel: e.channel,
      contact: e.contact,
      createdAt: e.created_at,
      ticket: e.incidents.external_ticket,
      appName: e.incidents.applications?.name ?? null,
    })),
    followUps: followRes.data.map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      assignedTo: f.assigned_to,
      assigneeName: f.assignee?.full_name ?? null,
      createdAt: f.created_at,
      appShortName: f.applications?.short_name ?? null,
      sourceLabel: f.source_id ? (numbers.get(f.source_id) ?? null) : null,
      shiftKind: f.shifts?.kind ?? null,
      shiftStartedAt: f.shifts?.started_at ?? null,
    })),
    openIncidents: incidentsRes.count ?? 0,
  };
}
