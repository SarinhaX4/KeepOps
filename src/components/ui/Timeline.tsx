import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, typography } from '@/theme';
import { formatShortDateTime } from '@/utils/format';
import type { TimelineItem, TimelineTone } from '@/utils/timeline';

const toneColor: Record<TimelineTone, string> = {
  ok: colors.ok,
  warn: colors.warn,
  bad: colors.bad,
  info: colors.info,
  neutral: colors.neutral,
};

/** Vertical timeline: dot + time (mono) + title + optional subtitle. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: toneColor[item.tone] }]} />
            {i < items.length - 1 ? <View style={styles.line} /> : null}
          </View>
          <View style={styles.body}>
            <Text style={styles.time}>{formatShortDateTime(item.at)}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { flex: 1, width: 1.5, backgroundColor: colors.border, marginVertical: 2 },
  body: { flex: 1, paddingBottom: spacing.lg, gap: 2 },
  time: { fontFamily: fonts.mono, fontSize: 12, color: colors.dim },
  title: { ...typography.bodySmall, fontFamily: fonts.medium, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
});
