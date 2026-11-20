/**
 * KeepOps color tokens.
 * Source of truth: docs/IDENTIDADE_VISUAL.md (section 4) + "Ajuste de 20/11" at its end:
 * the whole UI now derives from the logo's aqua → cyan family, on a deeper black.
 *
 * Rule: brand colors (aqua/cyan) mean identity and action.
 * Status colors (ok/warn/bad/info/neutral) mean operational state.
 * Never use brandPrimary to represent "approved".
 */

export const darkColors = {
  // Base
  bg: '#040607',
  surface: '#0A0F11',
  surface2: '#121A1D',
  border: 'rgba(237, 239, 238, 0.07)',
  borderHi: 'rgba(237, 239, 238, 0.15)',

  // Text
  text: '#EDEFEE',
  muted: '#9BA3A0',
  dim: '#78827E',

  // Brand
  // Logo gradient: aqua #10BFA5 → cyan #22C3EE. Text tint sits between both.
  brandPrimary: '#10BFA5',
  brandPrimaryText: '#2FD3CB',
  brandPrimarySoft: 'rgba(16, 191, 165, 0.13)',
  brandSecondary: '#22C3EE',
  brandSecondaryText: '#67D8F5',
  brandSecondarySoft: 'rgba(34, 195, 238, 0.12)',
  /** Third tone of the family (light sky), used for avatars/accents — no violet. */
  brandHighlight: '#7DD3FC',
  onBrandPrimary: '#03241F',

  // Operational states — same cool family, still distinct by hue + icon + text.
  ok: '#34D399',
  okText: '#7EE8BC',
  okSoft: 'rgba(52, 211, 153, 0.13)',
  warn: '#F59E0B',
  warnText: '#FCD34D',
  warnSoft: 'rgba(245, 158, 11, 0.14)',
  bad: '#F43F5E',
  badText: '#FDA4AF',
  badSoft: 'rgba(244, 63, 94, 0.14)',
  info: '#38BDF8',
  infoText: '#8AD7FA',
  infoSoft: 'rgba(56, 189, 248, 0.13)',
  neutral: '#5B6B73',
  neutralText: '#B7C4CA',
  neutralSoft: 'rgba(91, 107, 115, 0.16)',
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
