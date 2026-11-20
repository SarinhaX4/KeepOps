import { describe, expect, it } from '@jest/globals';

import { filterChanges } from '@/utils/changeFilters';
import { countWindow, validationProgress } from '@/utils/home';

const items = [
  { status: 'agendada' as const, change_number: 'CHG0012347', title: 'Renovação de certificado' },
  { status: 'em_validacao' as const, change_number: 'CHG0012345', title: 'Atualização de Java' },
];

describe('filterChanges', () => {
  it('filters by status and searches number/title ignoring accents and case', () => {
    expect(filterChanges(items, ['agendada'], '')).toHaveLength(1);
    expect(filterChanges(items, [], 'RENOVACAO')).toHaveLength(1);
    expect(filterChanges(items, [], '12345')[0]?.title).toBe('Atualização de Java');
    expect(filterChanges(items, ['agendada'], 'java')).toHaveLength(0);
  });
});

describe('home counters', () => {
  it('groups statuses into the 4 window counters', () => {
    expect(
      countWindow([
        'agendada',
        'aguardando_liberacao',
        'em_validacao',
        'validada',
        'validada_com_ressalvas',
        'reprovada',
        'cancelada',
      ]),
    ).toEqual({ scheduled: 2, validating: 1, validated: 2, failed: 1 });
  });

  it('computes checklist progress', () => {
    expect(validationProgress(['aprovado', 'reprovado', 'na', 'pendente'])).toEqual({
      total: 4,
      approved: 1,
      failed: 1,
      notApplicable: 1,
      pending: 1,
      done: 3,
    });
  });
});
