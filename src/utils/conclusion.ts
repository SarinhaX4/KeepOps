import type { Enums } from '@/types/database';

type ValidationResult = Enums<'validation_result'>;
export type ConclusionStatus = Extract<
  Enums<'change_status'>,
  'validada' | 'validada_com_ressalvas' | 'reprovada'
>;

export type ConclusionSuggestion = {
  status: ConclusionStatus;
  /** Why this result was suggested (pt-BR). */
  reason: string;
  pending: number;
};

/**
 * Suggested GMUD result (spec section 6 "Concluir GMUD"):
 * any failed step → reprovada; any N/A or pending → com ressalvas; all approved → validada.
 */
export function suggestConclusion(results: ValidationResult[]): ConclusionSuggestion {
  const failed = results.filter((r) => r === 'reprovado').length;
  const na = results.filter((r) => r === 'na').length;
  const pending = results.filter((r) => r === 'pendente').length;

  if (failed > 0) {
    return { status: 'reprovada', reason: `${failed} passo(s) reprovado(s).`, pending };
  }
  if (na > 0 || pending > 0) {
    const parts = [na ? `${na} N/A` : null, pending ? `${pending} pendente(s)` : null].filter(
      Boolean,
    );
    return { status: 'validada_com_ressalvas', reason: `${parts.join(' e ')}.`, pending };
  }
  if (results.length === 0) {
    return {
      status: 'validada_com_ressalvas',
      reason: 'Nenhum passo de validação registrado.',
      pending,
    };
  }
  return { status: 'validada', reason: 'Todos os passos aprovados.', pending };
}

export const conclusionLabel: Record<ConclusionStatus, string> = {
  validada: 'Validada',
  validada_com_ressalvas: 'Com ressalvas',
  reprovada: 'Reprovada',
};
