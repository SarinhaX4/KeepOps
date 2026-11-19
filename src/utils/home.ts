import type { Enums } from '@/types/database';

type ChangeStatus = Enums<'change_status'>;
type ValidationResult = Enums<'validation_result'>;

export type WindowCounters = {
  scheduled: number;
  validating: number;
  validated: number;
  failed: number;
};

/** Which list filter each home counter opens. */
export const counterStatuses: Record<keyof WindowCounters, ChangeStatus[]> = {
  scheduled: ['agendada', 'aguardando_liberacao'],
  validating: ['em_validacao'],
  validated: ['validada', 'validada_com_ressalvas'],
  failed: ['reprovada'],
};

/** Groups the window's changes into the 4 home counters (cancelled ones are ignored). */
export function countWindow(statuses: ChangeStatus[]): WindowCounters {
  const counters: WindowCounters = { scheduled: 0, validating: 0, validated: 0, failed: 0 };
  for (const status of statuses) {
    for (const key of Object.keys(counterStatuses) as (keyof WindowCounters)[]) {
      if (counterStatuses[key].includes(status)) counters[key] += 1;
    }
  }
  return counters;
}

export type ValidationProgress = {
  total: number;
  approved: number;
  failed: number;
  notApplicable: number;
  pending: number;
  /** Steps with any result other than "pendente". */
  done: number;
};

export function validationProgress(results: ValidationResult[]): ValidationProgress {
  const p: ValidationProgress = {
    total: results.length,
    approved: 0,
    failed: 0,
    notApplicable: 0,
    pending: 0,
    done: 0,
  };
  for (const r of results) {
    if (r === 'aprovado') p.approved += 1;
    else if (r === 'reprovado') p.failed += 1;
    else if (r === 'na') p.notApplicable += 1;
    else p.pending += 1;
  }
  p.done = p.total - p.pending;
  return p;
}

/** Do two time ranges overlap? (ISO strings or Dates) */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
