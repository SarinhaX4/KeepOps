import { Stack, useLocalSearchParams } from 'expo-router';
import { Clock, User } from 'lucide-react-native';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ChangeStatusBadge } from '@/components/domain/StatusBadge';
import { ValidationResultIcon, resultTone } from '@/components/domain/ValidationResultIcon';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChange } from '@/hooks/useChanges';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatShortDateTime, formatWindow } from '@/utils/format';
import { validationProgress } from '@/utils/home';

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const change = useChange(id);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={change.isRefetching}
          onRefresh={() => void change.refetch()}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <Stack.Screen options={{ title: change.data?.change_number ?? 'GMUD' }} />
      {change.isPending ? (
        <>
          <Skeleton height={140} />
          <Skeleton height={220} />
        </>
      ) : change.isError ? (
        <ErrorState message={change.error.message} onRetry={() => void change.refetch()} />
      ) : (
        <>
          <View style={styles.head}>
            <View style={styles.top}>
              <Text style={styles.number}>{change.data.change_number}</Text>
              <ChangeStatusBadge status={change.data.status} />
            </View>
            <Text style={styles.title}>{change.data.title}</Text>
            {change.data.description ? (
              <Text style={styles.body}>{change.data.description}</Text>
            ) : null}
            <View style={styles.meta}>
              <Clock size={14} color={colors.muted} strokeWidth={1.8} />
              <Text style={styles.metaText}>
                {formatWindow(change.data.window_start, change.data.window_end)}
              </Text>
            </View>
            {change.data.executor_team ? (
              <View style={styles.meta}>
                <User size={14} color={colors.muted} strokeWidth={1.8} />
                <Text style={styles.metaText}>
                  {change.data.executor_team}
                  {change.data.executor_contact ? ` · ${change.data.executor_contact}` : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <SectionHeader title="Aplicações afetadas" count={change.data.apps.length} />
          {change.data.apps.map((app) => {
            const p = validationProgress(app.steps.map((s) => s.result));
            return (
              <Card key={app.id} style={styles.appCard}>
                <View style={styles.top}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.mono}>
                    {p.done}/{p.total}
                    {p.failed ? ` · ${p.failed} ✗` : ''}
                  </Text>
                </View>
                <SegmentedProgress
                  ok={p.approved}
                  failed={p.failed}
                  neutral={p.notApplicable}
                  total={p.total}
                />
                {app.steps.map((s) => (
                  <View key={s.id} style={styles.step}>
                    <ValidationResultIcon result={s.result} />
                    <View style={styles.flex}>
                      <Text style={styles.stepTitle}>{s.step_title}</Text>
                      {s.note ? <Text style={styles.stepNote}>{s.note}</Text> : null}
                    </View>
                    <Text style={[styles.stepMeta, { color: resultTone[s.result].fg }]}>
                      {s.performed_at
                        ? formatShortDateTime(s.performed_at)
                        : resultTone[s.result].label}
                    </Text>
                  </View>
                ))}
              </Card>
            );
          })}
          <Text style={styles.note}>
            A validação interativa (marcar passos e health check) chega na Etapa 5.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  number: { fontFamily: fonts.monoMedium, fontSize: 14, color: colors.muted },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  body: { ...typography.bodySmall, color: colors.muted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.bodySmall, color: colors.muted, flexShrink: 1 },
  appCard: { gap: spacing.md },
  appName: { ...typography.title, color: colors.text, flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  stepTitle: { ...typography.bodySmall, color: colors.text },
  stepNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.badText },
  stepMeta: { fontFamily: fonts.mono, fontSize: 12 },
  note: { ...typography.meta, color: colors.dim, textAlign: 'center' },
});
