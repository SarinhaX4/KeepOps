import { describe, expect, it } from '@jest/globals';

import { suggestConclusion } from '@/utils/conclusion';

describe('suggestConclusion', () => {
  it('all approved → validada', () => {
    expect(suggestConclusion(['aprovado', 'aprovado']).status).toBe('validada');
  });

  it('any N/A → validada_com_ressalvas', () => {
    expect(suggestConclusion(['aprovado', 'na']).status).toBe('validada_com_ressalvas');
  });

  it('pending steps → validada_com_ressalvas, reporting how many', () => {
    const s = suggestConclusion(['aprovado', 'pendente', 'pendente']);
    expect(s.status).toBe('validada_com_ressalvas');
    expect(s.pending).toBe(2);
  });

  it('any failed step wins → reprovada', () => {
    expect(suggestConclusion(['aprovado', 'na', 'reprovado']).status).toBe('reprovada');
  });

  it('no steps at all is not a clean validation', () => {
    expect(suggestConclusion([]).status).toBe('validada_com_ressalvas');
  });
});
