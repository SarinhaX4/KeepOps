import { useQuery } from '@tanstack/react-query';

import { loadMetricsData } from '@/services/metrics';
import { loadPeriodData } from '@/services/period';
import type { Period } from '@/utils/calendar';
import { buildPeriodSummary } from '@/utils/periodSummary';

export function usePeriodSummary(period: Period) {
  return useQuery({
    queryKey: ['period', period.from.toISOString(), period.to.toISOString()],
    queryFn: async () => buildPeriodSummary(period.from, period.to, await loadPeriodData(period)),
  });
}

export function useMetricsData(days = 30) {
  return useQuery({
    queryKey: ['metrics', days],
    queryFn: () => loadMetricsData(new Date(Date.now() - days * 86_400_000)),
  });
}
