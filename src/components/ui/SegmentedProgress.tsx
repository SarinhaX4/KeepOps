import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

type SegmentedProgressProps = { ok: number; failed: number; neutral?: number; total: number };

/** Progress bar split into ok (green) / failed (red) / neutral (N/A) / pending (track). */
export function SegmentedProgress({ ok, failed, neutral = 0, total }: SegmentedProgressProps) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: ok + failed + neutral }}
    >
      {ok > 0 ? (
        <View style={[styles.seg, { width: `${pct(ok)}%`, backgroundColor: colors.ok }]} />
      ) : null}
      {failed > 0 ? (
        <View style={[styles.seg, { width: `${pct(failed)}%`, backgroundColor: colors.bad }]} />
      ) : null}
      {neutral > 0 ? (
        <View
          style={[styles.seg, { width: `${pct(neutral)}%`, backgroundColor: colors.neutral }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    gap: spacing.xs / 2,
  },
  seg: { height: 6, borderRadius: 3 },
});
