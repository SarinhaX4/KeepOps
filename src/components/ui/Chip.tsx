import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type ChipProps = { label: string; selected: boolean; onPress: () => void; count?: number };

/** Filter chip (radius 8). Selected state uses the brand soft fill. */
export function Chip({ label, selected, onPress, count }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
        {count !== undefined ? <Text style={styles.count}> {count}</Text> : null}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimarySoft },
  text: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  textSelected: { color: colors.brandPrimaryText },
  count: { fontFamily: fonts.mono, fontSize: 12 },
});
