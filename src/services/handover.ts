import { supabase } from '@/lib/supabase';
import { buildHandover, type Handover } from '@/utils/handover';

import { getHomeData } from './home';

/**
 * Loads everything the current user's open shift touched and builds the handover.
 * Reuses the Home query (window changes, unanswered calls, open follow-ups) + incidents.
 */
export async function loadCurrentHandover(params: {
  userId: string;
  authorName: string;
  notes: string;
  nextSteps: string;
  endedAt?: Date;
}): Promise<Handover | null> {
  const home = await getHomeData(params.userId);
  if (!home.shift) return null;
  const startedAt = home.shift.started_at;

  // Incidents opened during the shift, plus any still unresolved.
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('id, external_ticket, title, severity, status, opened_at, applications(name)')
    .or(`status.neq.resolvida,opened_at.gte.${startedAt}`)
    .order('opened_at');
  if (error) throw new Error(`Erro ao carregar ocorrências: ${error.message}`);

  const generatedAt = params.endedAt ?? new Date();
  return buildHandover({
    generatedAt,
    shift: {
      id: home.shift.id,
      kind: home.shift.kind,
      startedAt,
      endedAt: params.endedAt ? params.endedAt.toISOString() : null,
      authorName: params.authorName,
    },
    changes: home.changes.map((c) => ({
      ...c,
      apps: c.apps.map((a) => ({ name: a.name, results: a.results, lastCheck: a.lastCheck })),
    })),
    incidents: incidents.map(({ applications, ...i }) => ({
      ...i,
      appName: applications?.name ?? null,
    })),
    calls: home.calls,
    followUps: home.followUps,
    notes: params.notes,
    nextSteps: params.nextSteps,
  });
}
