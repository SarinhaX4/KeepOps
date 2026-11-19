import type { Enums } from '@/types/database';

import { HOLIDAYS } from './holidays';

export type ShiftKind = Enums<'shift_kind'>;

const SP_OFFSET_MS = -3 * 3_600_000;

/** São Paulo calendar fields of an instant (UTC-3, no DST). */
function spParts(date: Date) {
  const sp = new Date(date.getTime() + SP_OFFSET_MS);
  const y = sp.getUTCFullYear();
  const m = String(sp.getUTCMonth() + 1).padStart(2, '0');
  const d = String(sp.getUTCDate()).padStart(2, '0');
  return { iso: `${y}-${m}-${d}`, dow: sp.getUTCDay(), hour: sp.getUTCHours() };
}

/**
 * Suggests the shift kind from its start time (spec section 7):
 * Saturday, Sunday or holiday → fim_de_semana; 19h–7h → noturno; otherwise diurno.
 */
export function suggestShiftKind(startedAt: Date): ShiftKind {
  const { iso, dow, hour } = spParts(startedAt);
  if (dow === 0 || dow === 6 || HOLIDAYS.has(iso)) return 'fim_de_semana';
  if (hour >= 19 || hour < 7) return 'noturno';
  return 'diurno';
}

export const shiftKindLabel: Record<ShiftKind, string> = {
  noturno: 'Noturno',
  diurno: 'Diurno',
  fim_de_semana: 'Fim de semana',
};

/** Typical duration used to draw "today's window" on the home screen. */
export const shiftDurationHours: Record<ShiftKind, number> = {
  noturno: 9,
  diurno: 12,
  fim_de_semana: 12,
};
