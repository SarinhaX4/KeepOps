import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Application = Tables<'applications'>;

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase.from('applications').select('*').order('name');
  if (error) throw new Error(`Erro ao carregar aplicações: ${error.message}`);
  return data;
}

export type ApplicationWithCheck = Application & {
  lastCheck: Pick<
    Tables<'health_checks'>,
    'http_status' | 'latency_ms' | 'ok' | 'checked_at'
  > | null;
  stepCount: number;
};

export async function listApplicationsWithLastCheck(): Promise<ApplicationWithCheck[]> {
  const [appsRes, checksRes] = await Promise.all([
    supabase.from('applications').select('*, validation_steps(id)').order('name'),
    supabase
      .from('health_checks')
      .select('application_id, http_status, latency_ms, ok, checked_at')
      .order('checked_at', { ascending: false })
      .limit(200),
  ]);
  if (appsRes.error) throw new Error(`Erro ao carregar aplicações: ${appsRes.error.message}`);
  if (checksRes.error)
    throw new Error(`Erro ao carregar health checks: ${checksRes.error.message}`);

  return appsRes.data.map(({ validation_steps, ...app }) => {
    const check = checksRes.data.find((c) => c.application_id === app.id);
    return {
      ...app,
      stepCount: validation_steps.length,
      lastCheck: check
        ? {
            http_status: check.http_status,
            latency_ms: check.latency_ms,
            ok: check.ok,
            checked_at: check.checked_at,
          }
        : null,
    };
  });
}
