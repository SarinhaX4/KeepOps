import { supabase } from '@/lib/supabase';
import type { Period } from '@/utils/calendar';
import type { PeriodInput } from '@/utils/periodSummary';

import { listFollowUps } from './followUps';

/** Raw records for buildPeriodSummary (spec: GMUDs, shifts, incidents and follow-ups of the interval). */
export async function loadPeriodData({ from, to }: Period): Promise<PeriodInput> {
  const f = from.toISOString();
  const t = to.toISOString();

  const [changesRes, shiftsRes, incRes, callsRes, followUps] = await Promise.all([
    supabase
      .from('changes')
      .select(
        'id, change_number, title, status, window_start, window_end, change_applications(applications(id, name))',
      )
      .lt('window_start', t)
      .gt('window_end', f)
      .order('window_start'),
    supabase
      .from('shifts')
      .select(
        'id, kind, started_at, ended_at, status, author:profiles!shifts_user_id_fkey(full_name)',
      )
      .lt('started_at', t)
      .or(`ended_at.gt.${f},ended_at.is.null`)
      .order('started_at'),
    supabase
      .from('incidents')
      .select('id, external_ticket, title, severity, status, opened_at, applications(name)')
      .or(`status.neq.resolvida,and(opened_at.gte.${f},opened_at.lt.${t})`)
      .order('opened_at'),
    supabase
      .from('incident_events')
      .select('incident_id, channel, contact, created_at, incidents!inner(external_ticket, status)')
      .eq('kind', 'acionamento')
      .is('responded_at', null)
      .neq('incidents.status', 'resolvida'),
    listFollowUps({ includeDone: false }),
  ]);
  for (const r of [changesRes, shiftsRes, incRes, callsRes]) {
    if (r.error) throw new Error(`Erro ao carregar o período: ${r.error.message}`);
  }
  const changes = changesRes.data ?? [];

  const ids = changes.map((c) => c.id);
  const valRes = ids.length
    ? await supabase
        .from('validations')
        .select('change_id, application_id, result')
        .in('change_id', ids)
    : null;
  if (valRes?.error) throw new Error(`Erro ao carregar validações: ${valRes.error.message}`);

  return {
    changes: changes.map(({ change_applications, ...c }) => ({
      ...c,
      apps: change_applications
        .map((ca) => ca.applications)
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => ({
          name: a.name,
          results: (valRes?.data ?? [])
            .filter((v) => v.change_id === c.id && v.application_id === a.id)
            .map((v) => v.result),
        })),
    })),
    shifts: (shiftsRes.data ?? []).map(({ author, ...s }) => ({
      ...s,
      authorName: author?.full_name ?? null,
    })),
    incidents: (incRes.data ?? []).map(({ applications, ...i }) => ({
      ...i,
      appName: applications?.name ?? null,
    })),
    calls: (callsRes.data ?? []).map((e) => ({
      incidentId: e.incident_id,
      ticket: e.incidents.external_ticket,
      contact: e.contact,
      channel: e.channel,
      createdAt: e.created_at,
    })),
    followUps,
  };
}
