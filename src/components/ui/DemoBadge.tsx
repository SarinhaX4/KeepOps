import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

/** Neutral "DEMO" seal: every record in the app is fictitious. */
export function DemoBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Ambiente demonstrativo">
      <Text style={styles.label}>DEMO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.chip,
    backgroundColor: colors.neutralSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHi,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.neutralText,
    letterSpacing: 1,
  },
});
