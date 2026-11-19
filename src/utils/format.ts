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

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;
const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

/** "Quinta, 19 de novembro" (São Paulo). */
export function formatLongDate(date: Date): string {
  const s = toSpWallClock(date);
  return `${WEEKDAYS_LONG[s.getDay()]}, ${s.getDate()} de ${MONTHS[s.getMonth()]}`;
}

/** "Bom dia" / "Boa tarde" / "Boa noite" by São Paulo hour. */
export function greeting(date: Date): string {
  const h = toSpWallClock(date).getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Elapsed time as "02:14:37". */
export function formatElapsed(fromIso: string, now: Date): string {
  const total = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Minutes since an instant, for "18 min" badges. */
export function minutesSince(fromIso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 60_000));
}

/** "18 min" or "2 h 05". */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
