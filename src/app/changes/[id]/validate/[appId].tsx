import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HealthCheckCard } from '@/components/domain/HealthCheckCard';
import { ChangeStatusBadge } from '@/components/domain/StatusBadge';
import { ValidationStepRow } from '@/components/domain/ValidationStepRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChange } from '@/hooks/useChanges';
import { useOpenShift } from '@/hooks/useHome';
import {
  useCreateFollowUp,
  useRunHealthCheck,
  useSetStepNote,
  useSetStepResult,
} from '@/hooks/useValidation';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import { validationProgress } from '@/utils/home';

export default function ValidateAppScreen() {
  const { id, appId } = useLocalSearchParams<{ id: string; appId: string }>();
  const change = useChange(id);
  const shift = useOpenShift();
  const setResult = useSetStepResult(id);
  const setNote = useSetStepNote(id);
  const runCheck = useRunHealthCheck(id);
  const createFollowUp = useCreateFollowUp();

  const data = change.data;
  const app = data?.apps.find((a) => a.id === appId);
  const editable = data?.status === 'em_validacao';
  const checks = data?.checks.filter((c) => c.application_id === appId) ?? [];
  const baseline = [...checks].reverse().find((c) => c.phase === 'baseline');
  const post = [...checks].reverse().find((c) => c.phase === 'pos');
  // Before the release you capture the baseline; during validation, the post-change check.
  const nextPhase: 'baseline' | 'pos' =
    data?.status === 'agendada' || data?.status === 'aguardando_liberacao' || !baseline
      ? 'baseline'
      : 'pos';

  function run() {
    if (!app?.health_url) return;
    runCheck.mutate(
      { applicationId: app.id, url: app.health_url, phase: nextPhase },
      {
        onSuccess: (r) =>
          toast(
            r.ok
              ? `Disponível · HTTP ${r.httpStatus} · ${r.latencyMs} ms`
              : `Falha · ${r.httpStatus ? `HTTP ${r.httpStatus}` : r.errorMessage}`,
            r.ok ? 'success' : 'error',
          ),
        onError: (e) => Alert.alert('Erro no health check', e.message),
      },
    );
  }

  function followUpFor(stepId: string, stepTitle: string, note: string | null) {
    if (!app || !data) return;
    Alert.alert(
      'Criar pendência?',
      `"${app.short_name}: ${stepTitle}" ficará aberta para a equipe até alguém concluir.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Criar',
          onPress: () =>
            createFollowUp.mutate(
              {
                title: `${app.short_name}: ${stepTitle}`,
                description: [data.change_number, note].filter(Boolean).join(' · '),
                sourceType: 'validation',
                sourceId: stepId,
                applicationId: app.id,
                shiftId: shift.data?.id ?? null,
              },
              {
                onSuccess: () => toast('Pendência criada'),
                onError: (e) => Alert.alert('Erro', e.message),
              },
            ),
        },
      ],
    );
  }

  const p = app ? validationProgress(app.steps.map((s) => s.result)) : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={change.isRefetching}
            onRefresh={() => void change.refetch()}
            tintColor={colors.brandPrimary}
          />
        }
      >
        <Stack.Screen options={{ title: app?.short_name ?? 'Validação' }} />
        {change.isPending ? (
          <>
            <Skeleton height={160} />
            <Skeleton height={120} />
            <Skeleton height={120} />
          </>
        ) : change.isError ? (
          <ErrorState message={change.error.message} onRetry={() => void change.refetch()} />
        ) : !app || !data || !p ? (
          <ErrorState
            message="Aplicação não encontrada nesta GMUD."
            onRetry={() => void change.refetch()}
          />
        ) : (
          <>
            <View style={styles.head}>
              <View style={styles.top}>
                <Text style={styles.number}>{data.change_number}</Text>
                <ChangeStatusBadge status={data.status} />
              </View>
              <Text style={styles.title}>{app.name}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.meta}>Validação</Text>
                <Text style={styles.mono}>
                  {p.done} de {p.total} passos
                </Text>
              </View>
              <SegmentedProgress
                ok={p.approved}
                failed={p.failed}
                neutral={p.notApplicable}
                total={p.total}
              />
            </View>

            <HealthCheckCard
              baseline={baseline}
              post={post}
              nextPhase={nextPhase}
              url={app.health_url}
              running={runCheck.isPending}
              disabled={
                data.status !== 'em_validacao' &&
                data.status !== 'aguardando_liberacao' &&
                data.status !== 'agendada'
              }
              onRun={run}
            />

            <SectionHeader title="Roteiro de validação" count={app.steps.length} />
            {!editable ? (
              <Text style={styles.hint}>
                {data.status === 'agendada' || data.status === 'aguardando_liberacao'
                  ? 'Os passos ficam liberados quando a GMUD estiver "Em validação".'
                  : 'GMUD finalizada: somente leitura.'}
              </Text>
            ) : null}
            {app.steps.map((s, i) => (
              <ValidationStepRow
                key={s.id}
                step={s}
                index={i}
                editable={editable}
                onResult={(result) =>
                  setResult.mutate(
                    { stepId: s.id, result },
                    { onError: (e) => Alert.alert('Não foi possível salvar', e.message) },
                  )
                }
                onNote={(note) =>
                  setNote.mutate(
                    { stepId: s.id, note },
                    {
                      onSuccess: () => toast('Observação salva'),
                      onError: (e) => Alert.alert('Erro', e.message),
                    },
                  )
                }
                onCreateFollowUp={() => followUpFor(s.id, s.step_title, s.note)}
              />
            ))}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  head: { gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.muted },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { ...typography.bodySmall, color: colors.muted },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  hint: { ...typography.bodySmall, color: colors.warnText },
});
