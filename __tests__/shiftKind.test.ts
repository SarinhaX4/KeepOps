import { describe, expect, it } from '@jest/globals';

import { suggestShiftKind } from '@/utils/shiftKind';

/** São Paulo local time → Date. */
const sp = (s: string) => new Date(`${s}-03:00`);

describe('suggestShiftKind', () => {
  it('suggests "fim_de_semana" for a shift started on Saturday at 10h (acceptance criterion)', () => {
    expect(suggestShiftKind(sp('2026-11-21T10:00:00'))).toBe('fim_de_semana');
  });

  it('suggests "fim_de_semana" on Sunday and on national holidays', () => {
    expect(suggestShiftKind(sp('2026-11-22T23:00:00'))).toBe('fim_de_semana');
    expect(suggestShiftKind(sp('2026-11-20T10:00:00'))).toBe('fim_de_semana'); // Consciência Negra
    expect(suggestShiftKind(sp('2026-12-25T03:00:00'))).toBe('fim_de_semana');
  });

  it('suggests "noturno" on weekdays between 19h and 7h', () => {
    expect(suggestShiftKind(sp('2026-11-17T22:00:00'))).toBe('noturno');
    expect(suggestShiftKind(sp('2026-11-18T03:00:00'))).toBe('noturno');
    expect(suggestShiftKind(sp('2026-11-18T19:00:00'))).toBe('noturno');
    expect(suggestShiftKind(sp('2026-11-18T06:59:00'))).toBe('noturno');
  });

  it('suggests "diurno" on weekdays between 7h and 19h', () => {
    expect(suggestShiftKind(sp('2026-11-18T07:00:00'))).toBe('diurno');
    expect(suggestShiftKind(sp('2026-11-18T18:59:00'))).toBe('diurno');
  });

  it('uses São Paulo time regardless of the UTC date', () => {
    // 2026-11-14T01:00Z is already Saturday in UTC, but Friday 22:00 in São Paulo → weekday night.
    expect(suggestShiftKind(new Date('2026-11-14T01:00:00Z'))).toBe('noturno');
  });
});
