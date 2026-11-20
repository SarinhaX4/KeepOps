import type { Enums } from '@/types/database';

import { isWeekendOrHoliday } from './calendar';

type ChangeStatus = Enums<'change_status'>;

export type MetricsFilter = 'all' | 'weekday' | 'weekend';

export type MetricsChange = { id: string; status: ChangeStatus; window_start: string };
export type MetricsIncident = {
  id: string;
  change_id: string | null;
  severity: Enums<'incident_severity'>;
  status: Enums<'incident_status'>;
  opened_at: string;
  resolved_at: string | null;
};

export const FINALIZED: readonly ChangeStatus[] = [
  'validada',
  'validada_com_ressalvas',
  'reprovada',
];

/** Weekday × weekend is decided by the GMUD window start (spec section 7). */
export function matchesFilter(windowStart: string, filter: MetricsFilter): boolean {
  if (filter === 'all') return true;
  const weekend = isWeekendOrHoliday(new Date(windowStart));
  return filter === 'weekend' ? weekend : !weekend;
}

export type ChangeFailureRate = {
  finalized: number;
  failed: number;
  /** 0–1, or null when there is nothing finalized. */
  rate: number | null;
};

/**
 * Change failure rate (DORA-inspired):
 * (reprovada + validada_com_ressalvas + finalized GMUDs with a linked incident) ÷ finalized GMUDs.
 * Each GMUD counts once even if it matches more than one rule.
 */
export function changeFailureRate(
  changes: MetricsChange[],
  incidents: Pick<MetricsIncident, 'change_id'>[],
  filter: MetricsFilter = 'all',
): ChangeFailureRate {
  const withIncident = new Set(
    incidents.map((i) => i.change_id).filter((id): id is string => id !== null),
  );
  const finalized = changes.filter(
    (c) => FINALIZED.includes(c.status) && matchesFilter(c.window_start, filter),
  );
  const failed = finalized.filter(
    (c) =>
      c.status === 'reprovada' || c.status === 'validada_com_ressalvas' || withIncident.has(c.id),
  ).length;
  return {
    finalized: finalized.length,
    failed,
    rate: finalized.length ? failed / finalized.length : null,
  };
}

export type Mttr = { resolved: number; /** minutes, or null */ minutes: number | null };

/**
 * MTTR = mean(resolved_at − opened_at) of resolved incidents.
 * Filtered by the linked GMUD window when there is one, otherwise by opened_at.
 */
export function meanTimeToRestore(
  incidents: MetricsIncident[],
  changeWindowById: Map<string, string>,
  filter: MetricsFilter = 'all',
): Mttr {
  const resolved = incidents.filter((i) => {
    if (i.status !== 'resolvida' || !i.resolved_at) return false;
    const ref = (i.change_id && changeWindowById.get(i.change_id)) || i.opened_at;
    return matchesFilter(ref, filter);
  });
  if (!resolved.length) return { resolved: 0, minutes: null };
  const totalMs = resolved.reduce(
    (sum, i) =>
      sum + (new Date(i.resolved_at as string).getTime() - new Date(i.opened_at).getTime()),
    0,
  );
  return { resolved: resolved.length, minutes: Math.round(totalMs / resolved.length / 60_000) };
}

export function countBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, number> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<K, number>,
  );
}

export type AgeBucket = '< 1 dia' | '1–3 dias' | '> 3 dias';

export function ageBucket(createdAt: string, now: Date): AgeBucket {
  const days = (now.getTime() - new Date(createdAt).getTime()) / 86_400_000;
  if (days < 1) return '< 1 dia';
  if (days <= 3) return '1–3 dias';
  return '> 3 dias';
}

/** "12%" / "—" */
export function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}

/** "1 h 25" / "45 min" / "—" */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
