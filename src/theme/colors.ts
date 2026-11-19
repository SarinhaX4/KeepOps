/**
 * KeepOps color tokens.
 * Source of truth: docs/IDENTIDADE_VISUAL.md (section 4).
 *
 * Rule: brand colors (aqua/cyan) mean identity and action.
 * Status colors (ok/warn/bad/info/neutral) mean operational state.
 * Never use brandPrimary to represent "approved".
 */

export const darkColors = {
  // Base
  bg: '#0B0F11',
  surface: '#111719',
  surface2: '#1A2427',
  border: 'rgba(237, 239, 238, 0.08)',
  borderHi: 'rgba(237, 239, 238, 0.16)',

  // Text
  text: '#EDEFEE',
  muted: '#9BA3A0',
  dim: '#68716D',

  // Brand
  brandPrimary: '#10BFA5',
  brandPrimaryText: '#5DE2C7',
  brandPrimarySoft: 'rgba(16, 191, 165, 0.14)',
  brandSecondary: '#22C3EE',
  brandSecondaryText: '#7DDCF4',
  brandSecondarySoft: 'rgba(34, 195, 238, 0.13)',
  brandHighlight: '#8B5CF6',
  onBrandPrimary: '#042B26',

  // Operational states
  ok: '#22C55E',
  okText: '#86EFAC',
  okSoft: 'rgba(34, 197, 94, 0.14)',
  warn: '#F59E0B',
  warnText: '#FCD34D',
  warnSoft: 'rgba(245, 158, 11, 0.14)',
  bad: '#F43F5E',
  badText: '#FDA4AF',
  badSoft: 'rgba(244, 63, 94, 0.14)',
  info: '#3B82F6',
  infoText: '#93C5FD',
  infoSoft: 'rgba(59, 130, 246, 0.14)',
  neutral: '#64748B',
  neutralText: '#CBD5E1',
  neutralSoft: 'rgba(100, 116, 139, 0.14)',
} as const;

export type ColorToken = keyof typeof darkColors;
export type ColorPalette = Record<ColorToken, string>;

export const lightColors: ColorPalette = {
  bg: '#F5F8F7',
  surface: '#FFFFFF',
  surface2: '#EDF3F1',
  border: 'rgba(11, 15, 17, 0.10)',
  borderHi: 'rgba(11, 15, 17, 0.18)',

  text: '#0B0F11',
  muted: '#52615C',
  dim: '#74817D',

  brandPrimary: '#087A70',
  brandPrimaryText: '#087A70',
  brandPrimarySoft: 'rgba(8, 122, 112, 0.10)',
  brandSecondary: '#0B7590',
  brandSecondaryText: '#0B7590',
  brandSecondarySoft: 'rgba(11, 117, 144, 0.10)',
  brandHighlight: '#7C3AED',
  onBrandPrimary: '#FFFFFF',

  ok: '#15803D',
  okText: '#166534',
  okSoft: 'rgba(21, 128, 61, 0.10)',
  warn: '#B45309',
  warnText: '#92400E',
  warnSoft: 'rgba(180, 83, 9, 0.10)',
  bad: '#E11D48',
  badText: '#9F1239',
  badSoft: 'rgba(225, 29, 72, 0.10)',
  info: '#2563EB',
  infoText: '#1D4ED8',
  infoSoft: 'rgba(37, 99, 235, 0.10)',
  neutral: '#64748B',
  neutralText: '#475569',
  neutralSoft: 'rgba(100, 116, 139, 0.10)',
};

/** Dark is the primary theme. Light theme is "if time allows" (spec section 5). */
export const colors: ColorPalette = darkColors;
