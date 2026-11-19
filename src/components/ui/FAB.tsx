import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

type FABProps = { label: string; icon: LucideIcon; onPress: () => void };

/** Floating primary action, bottom-right, within thumb reach. */
export function FAB({ label, icon: Icon, onPress }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Icon size={20} color={colors.onBrandPrimary} strokeWidth={2.2} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.brandPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onBrandPrimary },
});
