import { HOLIDAYS } from './holidays';

/** São Paulo is UTC-3 all year (no DST since 2019). */
export const SP_OFFSET_MS = -3 * 3_600_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** São Paulo calendar fields for an instant. */
export function spParts(date: Date) {
  const sp = new Date(date.getTime() + SP_OFFSET_MS);
  const y = sp.getUTCFullYear();
  const m = sp.getUTCMonth();
  const d = sp.getUTCDate();
  const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { y, m, d, iso, dow: sp.getUTCDay(), hour: sp.getUTCHours() };
}

/** Instant for a São Paulo local date/time. */
export function spDate(y: number, m: number, d: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(y, m, d, hour, minute) - SP_OFFSET_MS);
}

/** Saturday, Sunday or national holiday in São Paulo time. */
export function isWeekendOrHoliday(date: Date): boolean {
  const p = spParts(date);
  return p.dow === 0 || p.dow === 6 || HOLIDAYS.has(p.iso);
}

export type Period = { from: Date; to: Date };

/**
 * Most recent *completed* weekend: Friday 19:00 → Monday 07:00 (São Paulo),
 * i.e. the last one whose Monday 07:00 is already in the past.
 */
export function lastWeekend(now: Date): Period {
  const p = spParts(now);
  // Days back to the most recent Monday (0 if today is Monday).
  const back = (p.dow + 6) % 7;
  let monday = spDate(p.y, p.m, p.d - back, 7);
  if (monday > now) monday = new Date(monday.getTime() - 7 * DAY);
  return { from: new Date(monday.getTime() - 2 * DAY - 12 * HOUR), to: monday };
}

export function last24h(now: Date): Period {
  return { from: new Date(now.getTime() - DAY), to: now };
}

export function lastDays(now: Date, days: number): Period {
  return { from: new Date(now.getTime() - days * DAY), to: now };
}
