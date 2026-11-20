import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

type Bar = { label: string; value: number; color: string };

/** Minimal horizontal bar chart (no chart library). Value is always shown as text. */
export function BarList({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <View style={styles.wrap}>
      {bars.map((b) => (
        <View key={b.label} style={styles.row} accessibilityLabel={`${b.label}: ${b.value}`}>
          <Text style={styles.label} numberOfLines={1}>
            {b.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[styles.bar, { width: `${(b.value / max) * 100}%`, backgroundColor: b.color }]}
            />
          </View>
          <Text style={styles.value}>{b.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { width: 120, fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  bar: { height: 10, borderRadius: 5, minWidth: 2 },
  value: {
    width: 28,
    textAlign: 'right',
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.text,
  },
});
