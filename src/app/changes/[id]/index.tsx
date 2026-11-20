import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ban, ChevronRight, Clock, Pencil, Siren, User } from 'lucide-react-native';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ChangeStatusBadge } from '@/components/domain/StatusBadge';
import { ValidationResultIcon, resultTone } from '@/components/domain/ValidationResultIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { Timeline } from '@/components/ui/Timeline';
import { useChange, useSetChangeStatus } from '@/hooks/useChanges';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import {
  cancelAction,
  canCancel,
  canEdit,
  primaryAction,
  type ChangeAction,
} from '@/utils/changeActions';
import { formatShortDateTime, formatWindow } from '@/utils/format';
import { validationProgress } from '@/utils/home';
import { buildChangeTimeline } from '@/utils/timeline';

export default function ChangeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const change = useChange(id);
  const setStatus = useSetChangeStatus(id);

  function run(action: ChangeAction) {
    const apply = () =>
      setStatus.mutate(
        { status: action.to },
        {
          onSuccess: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast(action.to === 'cancelada' ? 'GMUD cancelada' : 'Status atualizado');
          },
          onError: (e) => Alert.alert('Erro', e.message),
        },
      );
    if (!action.confirm) return apply();
    Alert.alert(action.confirm.title, action.confirm.message, [
      { text: 'Voltar', style: 'cancel' },
      { text: action.label, style: 'destructive', onPress: apply },
    ]);
  }

  const data = change.data;
  const action = data ? primaryAction(data.status) : null;

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
      <Stack.Screen options={{ title: data?.change_number ?? 'GMUD' }} />
      {change.isPending ? (
        <>
          <Skeleton height={140} />
          <Skeleton height={220} />
        </>
      ) : change.isError ? (
        <ErrorState message={change.error.message} onRetry={() => void change.refetch()} />
      ) : data ? (
        <>
          <View style={styles.head}>
            <View style={styles.top}>
              <Text style={styles.number}>{data.change_number}</Text>
              <ChangeStatusBadge status={data.status} />
            </View>
            <Text style={styles.title}>{data.title}</Text>
            {data.description ? <Text style={styles.body}>{data.description}</Text> : null}
            <View style={styles.meta}>
              <Clock size={14} color={colors.muted} strokeWidth={1.8} />
              <Text style={styles.metaText}>
                {formatWindow(data.window_start, data.window_end)}
              </Text>
            </View>
            {data.executor_team || data.executor_contact ? (
              <View style={styles.meta}>
                <User size={14} color={colors.muted} strokeWidth={1.8} />
                <Text style={styles.metaText}>
                  {[data.executor_team, data.executor_contact].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ) : null}
            {data.conclusion_note ? (
              <Text style={styles.conclusion}>Conclusão: {data.conclusion_note}</Text>
            ) : null}
          </View>

          {action ? (
            <Button
              label={action.label}
              icon={ChevronRight}
              onPress={() => run(action)}
              loading={setStatus.isPending}
            />
          ) : null}
          {canEdit(data.status) || canCancel(data.status) ? (
            <View style={styles.secondary}>
              {canEdit(data.status) ? (
                <View style={styles.flex}>
                  <Button
                    label="Editar"
                    icon={Pencil}
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/changes/[id]/edit', params: { id } })}
                  />
                </View>
              ) : null}
              {canCancel(data.status) ? (
                <View style={styles.flex}>
                  <Button
                    label="Cancelar"
                    icon={Ban}
                    variant="danger"
                    onPress={() => run(cancelAction)}
                    disabled={setStatus.isPending}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <SectionHeader title="Aplicações afetadas" count={data.apps.length} />
          {data.apps.map((app) => {
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
          {data.status === 'em_validacao' ? (
            <Text style={styles.note}>Marcar passos e executar health check chega na Etapa 5.</Text>
          ) : null}

          {data.incidents.length > 0 ? (
            <>
              <SectionHeader title="Ocorrências vinculadas" count={data.incidents.length} />
              {data.incidents.map((i) => (
                <Card key={i.id} style={styles.incident}>
                  <Siren
                    size={16}
                    color={i.status === 'resolvida' ? colors.okText : colors.badText}
                    strokeWidth={1.8}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.stepTitle}>{i.title}</Text>
                    <Text style={styles.mono}>
                      {[
                        i.external_ticket,
                        i.severity.toUpperCase(),
                        i.status === 'resolvida' ? 'resolvida' : 'aberta',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </Card>
              ))}
            </>
          ) : null}

          <SectionHeader title="Linha do tempo" />
          <Card>
            <Timeline items={buildChangeTimeline(data)} />
          </Card>
        </>
      ) : null}
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
  conclusion: { ...typography.bodySmall, color: colors.warnText },
  secondary: { flexDirection: 'row', gap: spacing.md },
  appCard: { gap: spacing.md },
  appName: { ...typography.title, color: colors.text, flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  stepTitle: { ...typography.bodySmall, color: colors.text },
  stepNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.badText },
  stepMeta: { fontFamily: fonts.mono, fontSize: 12 },
  note: { ...typography.meta, color: colors.dim, textAlign: 'center' },
  incident: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
