import { format, formatDistanceToNowStrict, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Dates are stored in UTC and shown in America/Sao_Paulo (UTC-3, no DST since 2019).
 * These helpers convert between a real instant and a "wall clock" Date whose local
 * fields match São Paulo, so date-fns formats correctly on any device timezone.
 */
const SP_OFFSET_MIN = -180;

export function toSpWallClock(date: Date): Date {
  return new Date(date.getTime() + (date.getTimezoneOffset() + SP_OFFSET_MIN) * 60_000);
}

export function fromSpWallClock(wall: Date): Date {
  return new Date(wall.getTime() - (wall.getTimezoneOffset() + SP_OFFSET_MIN) * 60_000);
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const INPUT_DATE_FORMAT = 'dd/MM/yyyy HH:mm';

/** "19/11 22:00" */
export function formatShortDateTime(value: string | Date): string {
  return format(toSpWallClock(new Date(value)), 'dd/MM HH:mm', { locale: ptBR });
}

/** "22:00" */
export function formatTime(value: string | Date): string {
  return format(toSpWallClock(new Date(value)), 'HH:mm', { locale: ptBR });
}

/** "Sáb 21/11 10:00 → 12:00" (end date shown only when it differs). */
export function formatWindow(start: string, end: string): string {
  const s = toSpWallClock(new Date(start));
  const e = toSpWallClock(new Date(end));
  const sameDay = format(s, 'yyyyMMdd') === format(e, 'yyyyMMdd');
  const left = `${WEEKDAYS[s.getDay()]} ${format(s, 'dd/MM HH:mm')}`;
  const right = format(e, sameDay ? 'HH:mm' : 'dd/MM HH:mm');
  return `${left} → ${right}`;
}

/** "há 12 min" */
export function formatRelative(value: string | Date): string {
  return `há ${formatDistanceToNowStrict(new Date(value), { locale: ptBR })}`;
}

/** Text input "dd/MM/yyyy HH:mm" (São Paulo time) → Date, or null if invalid. */
export function parseSpInput(text: string): Date | null {
  const wall = parse(text.trim(), INPUT_DATE_FORMAT, new Date());
  return Number.isNaN(wall.getTime()) ? null : fromSpWallClock(wall);
}

/** Date → "dd/MM/yyyy HH:mm" in São Paulo time, for prefilled inputs. */
export function toSpInput(date: Date): string {
  return format(toSpWallClock(date), INPUT_DATE_FORMAT);
}

/** First letters of the first and last names: "Ana Souza" → "AS". */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
