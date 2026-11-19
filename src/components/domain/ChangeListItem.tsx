import { StyleSheet, Text, View } from 'react-native';

import type { ChangeListItem as Change } from '@/services/changes';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { formatWindow } from '@/utils/format';

import { ChangeStatusBadge } from './StatusBadge';

export function ChangeListItem({ change }: { change: Change }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.number}>{change.change_number}</Text>
        <ChangeStatusBadge status={change.status} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {change.title}
      </Text>
      <Text style={styles.meta}>{formatWindow(change.window_start, change.window_end)}</Text>
      {change.apps.length > 0 ? (
        <View style={styles.apps}>
          {change.apps.map((a) => (
            <View key={a.id} style={styles.app}>
              <Text style={styles.appText}>{a.short_name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  number: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.muted },
  title: { ...typography.title, color: colors.text },
  meta: { ...typography.meta, color: colors.muted },
  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  app: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.chip,
    backgroundColor: colors.surface2,
  },
  appText: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
});
