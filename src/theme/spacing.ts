/** Spacing scale: multiples of 4 (spec section 9). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;

/** Corner radius: chips 8, buttons/inputs 12, cards 16. */
export const radius = {
  chip: 8,
  control: 12,
  card: 16,
} as const;

/** Minimum touch target (pt). */
export const hitTarget = 44;
