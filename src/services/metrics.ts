import { supabase } from '@/lib/supabase';
import type { MetricsChange, MetricsIncident } from '@/utils/metrics';

export type MetricsData = {
  changes: MetricsChange[];
  incidents: MetricsIncident[];
  openFollowUps: { id: string; created_at: string }[];
};

/** Last N days of GMUDs and incidents + currently open follow-ups. */
export async function loadMetricsData(since: Date): Promise<MetricsData> {
  const s = since.toISOString();
  const [ch, inc, fu] = await Promise.all([
    supabase.from('changes').select('id, status, window_start').gte('window_start', s),
    supabase
      .from('incidents')
      .select('id, change_id, severity, status, opened_at, resolved_at')
      .or(`opened_at.gte.${s},status.neq.resolvida`),
    supabase.from('follow_ups').select('id, created_at').neq('status', 'concluida'),
  ]);
  if (ch.error) throw new Error(`Erro ao carregar GMUDs: ${ch.error.message}`);
  if (inc.error) throw new Error(`Erro ao carregar ocorrências: ${inc.error.message}`);
  if (fu.error) throw new Error(`Erro ao carregar pendências: ${fu.error.message}`);
  return { changes: ch.data, incidents: inc.data, openFollowUps: fu.data };
}
