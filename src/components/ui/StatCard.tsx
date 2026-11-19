import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

import { Card } from './Card';

type StatCardProps = {
  label: string;
  value: number;
  /** Dot color (status). */
  dot: string;
  /** Number color. */
  valueColor: string;
  onPress?: () => void;
};

export function StatCard({ label, value, dot, valueColor, onPress }: StatCardProps) {
  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: spacing.sm, minHeight: 96 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  value: { fontFamily: fonts.semibold, fontSize: 30, letterSpacing: -0.6 },
});
