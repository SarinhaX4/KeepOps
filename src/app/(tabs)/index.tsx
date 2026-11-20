import { router } from 'expo-router';
import {
  ArrowRightLeft,
  CalendarRange,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  Layers,
} from 'lucide-react-native';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/domain/BrandHeader';
import { CallRow } from '@/components/domain/CallRow';
import { FollowUpRow } from '@/components/domain/FollowUpRow';
import { OpenShiftCard, StartShiftCard } from '@/components/domain/ShiftCard';
import { ValidationNowCard } from '@/components/domain/ValidationNowCard';
import { Avatar } from '@/components/ui/Avatar';
import { Appear } from '@/components/ui/Appear';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useAssignFollowUp, useHome, useStartShift } from '@/hooks/useHome';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useMetricsData } from '@/hooks/usePeriod';
import { usePendingHandover } from '@/hooks/useShifts';
import { signOut } from '@/services/auth';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatLongDate, formatTime, greeting } from '@/utils/format';
import { spParts } from '@/utils/calendar';
import { countWindow, counterStatuses, type WindowCounters } from '@/utils/home';
import { changeFailureRate, formatDuration, formatRate, meanTimeToRestore } from '@/utils/metrics';
import { shiftKindLabel, suggestShiftKind, type ShiftKind } from '@/utils/shiftKind';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você poderá entrar novamente com outro usuário demo.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Sair',
      style: 'destructive',
      onPress: () => {
        signOut().catch((e: unknown) =>
          Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível sair.'),
        );
      },
    },
  ]);
}

function openChanges(key: keyof WindowCounters) {
  router.push({ pathname: '/changes', params: { status: counterStatuses[key].join(',') } });
}

export default function HomeScreen() {
  const now = useNow(60_000);
  const { data: profile } = useProfile();
  const home = useHome();
  const pendingHandover = usePendingHandover();
  const metrics = useMetricsData(30);
  useRefreshOnFocus(() =>
    Promise.all([home.refetch(), pendingHandover.refetch(), metrics.refetch()]),
  );
  const startShift = useStartShift();
  const assign = useAssignFollowUp();

  const firstName = profile?.full_name.split(' ')[0] ?? '';
  const isOnCall = profile?.role === 'plantonista';

  function askStartShift() {
    const suggested = suggestShiftKind(new Date());
    const kinds: ShiftKind[] = ['noturno', 'diurno', 'fim_de_semana'];
    const start = (kind: ShiftKind) =>
      startShift.mutate(kind, {
        onError: (e) => Alert.alert('Erro', e.message),
      });
    Alert.alert(
      'Iniciar turno',
      `Tipo sugerido: ${shiftKindLabel[suggested]}. Confirme ou ajuste.`,
      [
        ...kinds
          .filter((k) => k !== suggested)
          .map((k) => ({ text: shiftKindLabel[k], onPress: () => start(k) })),
        { text: `${shiftKindLabel[suggested]} (sugerido)`, onPress: () => start(suggested) },
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  function assignFollowUp(id: string) {
    assign.mutate(id, {
      onError: (e) => Alert.alert('Não foi possível assumir', e.message),
    });
  }

  const data = home.data;
  const counters = data ? countWindow(data.changes.map((c) => c.status)) : null;
  const validatingNow = data?.changes.find((c) => c.status === 'em_validacao');
  const mine = data?.followUps.filter((f) => f.assignedTo === profile?.id) ?? [];
  const unassigned = data?.followUps.filter((f) => f.assignedTo === null) ?? [];
  // Monday/Tuesday: the weekend summary is the news; other days, the last 24h.
  const weekendNews = [1, 2].includes(spParts(now).dow);
  const md = metrics.data;
  const cfr = md ? changeFailureRate(md.changes, md.incidents) : null;
  const mttr = md
    ? meanTimeToRestore(md.incidents, new Map(md.changes.map((c) => [c.id, c.window_start])))
    : null;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={home.isRefetching}
          onRefresh={() => {
            void home.refetch();
            void pendingHandover.refetch();
          }}
          tintColor={colors.brandPrimary}
          colors={[colors.brandPrimary]}
        />
      }
    >
      <View style={styles.header}>
        <BrandHeader />
        <View style={styles.headerActions}>
          <IconButton
            icon={Layers}
            label="Aplicações"
            onPress={() => router.push('/applications')}
          />
          {profile ? (
            <Pressable
              onPress={confirmSignOut}
              accessibilityRole="button"
              accessibilityLabel={`Perfil de ${profile.full_name}. Toque para sair`}
              hitSlop={6}
            >
              <Avatar name={profile.full_name} color={profile.avatar_color} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View>
        <Text style={styles.date}>{formatLongDate(now)}</Text>
        <Text style={styles.greeting}>
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}
        </Text>
      </View>

      {home.isPending ? (
        <View style={styles.stack}>
          <Skeleton height={72} />
          <Skeleton height={200} />
          <Skeleton height={260} />
        </View>
      ) : home.isError ? (
        <ErrorState message={home.error.message} onRetry={() => void home.refetch()} />
      ) : data && counters && profile ? (
        <Appear style={styles.stack}>
          {pendingHandover.data && isOnCall ? (
            <Card
              style={styles.banner}
              onPress={() =>
                router.push({
                  pathname: '/shifts/[id]',
                  params: { id: pendingHandover.data?.id as string },
                })
              }
              accessibilityLabel="Passagem aguardando seu recebimento"
            >
              <ArrowRightLeft size={18} color={colors.warnText} strokeWidth={1.9} />
              <View style={styles.flex}>
                <Text style={styles.bannerTitle}>Passagem aguardando seu recebimento</Text>
                <Text style={styles.bannerMeta}>
                  De {pendingHandover.data.authorName ?? 'outro plantonista'} · toque para ler e
                  confirmar
                </Text>
              </View>
            </Card>
          ) : null}

          {data.shift ? (
            <Card
              style={styles.shiftLink}
              onPress={() => router.push('/shifts')}
              accessibilityLabel="Abrir turno e passagem"
            >
              <OpenShiftCard shift={data.shift} />
            </Card>
          ) : isOnCall ? (
            <StartShiftCard
              suggested={suggestShiftKind(now)}
              onStart={askStartShift}
              loading={startShift.isPending}
            />
          ) : null}

          <Card style={styles.summaryCard}>
            <View style={styles.linkCard}>
              <CalendarRange size={18} color={colors.brandPrimaryText} strokeWidth={1.9} />
              <View style={styles.flex}>
                <Text style={styles.linkTitle}>
                  {weekendNews ? 'Resumo do fim de semana disponível' : 'Resumo do período'}
                </Text>
                <Text style={styles.bannerMeta}>
                  GMUDs, ocorrências e pendências de todos os turnos
                </Text>
              </View>
            </View>
            <View style={styles.summaryChips}>
              <Chip
                label="Último fim de semana"
                selected={weekendNews}
                onPress={() =>
                  router.push({ pathname: '/shifts/summary', params: { period: 'weekend' } })
                }
              />
              <Chip
                label="Últimas 24h"
                selected={!weekendNews}
                onPress={() =>
                  router.push({ pathname: '/shifts/summary', params: { period: '24h' } })
                }
              />
            </View>
          </Card>

          <SectionHeader
            title={data.shift ? 'Janela do turno' : 'GMUDs de hoje'}
            right={
              <Text style={styles.mono}>
                {formatTime(data.window.start)} – {formatTime(data.window.end)}
              </Text>
            }
          />
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <StatCard
                label="Agendadas"
                value={counters.scheduled}
                dot={colors.neutral}
                valueColor={colors.text}
                onPress={() => openChanges('scheduled')}
              />
              <StatCard
                label="Em validação"
                value={counters.validating}
                dot={colors.info}
                valueColor={colors.infoText}
                onPress={() => openChanges('validating')}
              />
            </View>
            <View style={styles.gridRow}>
              <StatCard
                label="Validadas"
                value={counters.validated}
                dot={colors.ok}
                valueColor={colors.okText}
                onPress={() => openChanges('validated')}
              />
              <StatCard
                label="Com falha"
                value={counters.failed}
                dot={colors.bad}
                valueColor={colors.badText}
                onPress={() => openChanges('failed')}
              />
            </View>
          </View>

          {validatingNow ? (
            <>
              <SectionHeader
                title="Em validação agora"
                actionLabel="Ver GMUDs"
                onAction={() => router.push('/changes')}
              />
              <ValidationNowCard
                change={validatingNow}
                onContinue={() =>
                  router.push({ pathname: '/changes/[id]', params: { id: validatingNow.id } })
                }
              />
            </>
          ) : null}

          {data.calls.length > 0 ? (
            <>
              <SectionHeader
                title="Acionamentos sem resposta"
                count={data.calls.length}
                countTone="warn"
              />
              {data.calls.map((c) => (
                <CallRow
                  key={c.id}
                  call={c}
                  now={now}
                  onPress={() =>
                    router.push({ pathname: '/incidents/[id]', params: { id: c.incidentId } })
                  }
                />
              ))}
            </>
          ) : null}

          {mine.length > 0 ? (
            <>
              <SectionHeader
                title="Minhas pendências"
                count={mine.length}
                actionLabel="Todas"
                onAction={() => router.push('/follow-ups')}
              />
              {mine.map((f) => (
                <FollowUpRow
                  key={f.id}
                  followUp={f}
                  currentUserId={profile.id}
                  onAssign={() => assignFollowUp(f.id)}
                  onPress={() =>
                    router.push({ pathname: '/follow-ups/[id]', params: { id: f.id } })
                  }
                />
              ))}
            </>
          ) : null}

          <SectionHeader
            title="Pendências sem responsável"
            count={unassigned.length}
            countTone={unassigned.length > 0 ? 'warn' : 'neutral'}
            actionLabel="Todas"
            onAction={() => router.push('/follow-ups')}
          />
          {unassigned.length > 0 ? (
            unassigned.map((f) => (
              <FollowUpRow
                key={f.id}
                followUp={f}
                currentUserId={profile.id}
                onAssign={() => assignFollowUp(f.id)}
                onPress={() => router.push({ pathname: '/follow-ups/[id]', params: { id: f.id } })}
              />
            ))
          ) : (
            <Card style={styles.allClear}>
              <CircleCheck size={18} color={colors.okText} strokeWidth={1.8} />
              <Text style={styles.allClearText}>Todas as pendências têm responsável.</Text>
            </Card>
          )}

          <SectionHeader
            title="Métricas · 30 dias"
            actionLabel="Ver tudo"
            onAction={() => router.push('/metrics')}
          />
          <Card
            style={styles.metrics}
            onPress={() => router.push('/metrics')}
            accessibilityLabel="Abrir métricas"
          >
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Taxa de falha</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: (cfr?.rate ?? 0) > 0.15 ? colors.badText : colors.okText },
                ]}
              >
                {formatRate(cfr?.rate ?? null)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>MTTR</Text>
              <Text style={styles.metricValue}>{formatDuration(mttr?.minutes ?? null)}</Text>
            </View>
            <ChartColumn size={20} color={colors.dim} strokeWidth={1.8} />
          </Card>
        </Appear>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { ...typography.bodySmall, color: colors.muted },
  greeting: { ...typography.display, color: colors.text },
  stack: { gap: spacing.lg },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  grid: { gap: spacing.md },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  summaryCard: { gap: spacing.md },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linkTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  metric: { flex: 1, gap: 2 },
  metricLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  metricValue: { fontFamily: fonts.semibold, fontSize: 24, color: colors.text },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.warn,
    backgroundColor: colors.warnSoft,
  },
  bannerTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  bannerMeta: { ...typography.meta, color: colors.muted },
  shiftLink: { padding: 0, borderWidth: 0 },
  allClear: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  allClearText: { ...typography.bodySmall, color: colors.muted },
});
