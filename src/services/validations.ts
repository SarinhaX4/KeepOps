import { supabase } from '@/lib/supabase';
import type { Enums } from '@/types/database';
import type { HealthCheckResult } from '@/utils/healthcheck';

export type ValidationResult = Enums<'validation_result'>;

/** Saves a step result with author and time. Back to "pendente" clears both. */
export async function setValidationResult(
  validationId: string,
  result: ValidationResult,
  userId: string,
): Promise<void> {
  const pending = result === 'pendente';
  const { error } = await supabase
    .from('validations')
    .update({
      result,
      performed_by: pending ? null : userId,
      performed_at: pending ? null : new Date().toISOString(),
    })
    .eq('id', validationId);
  if (error) throw new Error(`Não foi possível salvar o passo: ${error.message}`);
}

export async function setValidationNote(validationId: string, note: string): Promise<void> {
  const { error } = await supabase
    .from('validations')
    .update({ note: note.trim() || null })
    .eq('id', validationId);
  if (error) throw new Error(`Não foi possível salvar a observação: ${error.message}`);
}

export async function saveHealthCheck(params: {
  applicationId: string;
  changeId: string;
  phase: Enums<'health_phase'>;
  result: HealthCheckResult;
  userId: string;
}): Promise<void> {
  const { result } = params;
  const { error } = await supabase.from('health_checks').insert({
    application_id: params.applicationId,
    change_id: params.changeId,
    phase: params.phase,
    http_status: result.httpStatus,
    latency_ms: result.latencyMs,
    ok: result.ok,
    error_message: result.errorMessage,
    checked_by: params.userId,
  });
  if (error) throw new Error(`Não foi possível gravar o health check: ${error.message}`);
}
