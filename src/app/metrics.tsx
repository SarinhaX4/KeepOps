import { Gauge, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { changeStatusTone } from '@/components/domain/StatusBadge';
import { BarList } from '@/components/ui/BarList';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useMetricsData } from '@/hooks/usePeriod';
import type { ChangeStatus } from '@/services/changes';
import { colors, fonts, spacing, typography } from '@/theme';
import {
  ageBucket,
  changeFailureRate,
  countBy,
  formatDuration,
  formatRate,
  matchesFilter,
  meanTimeToRestore,
  type AgeBucket,
  type MetricsFilter,
} from '@/utils/metrics';

const filters: { key: MetricsFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'weekday', label: 'Semana' },
  { key: 'weekend', label: 'Fim de semana' },
];

const statusColor: Record<ChangeStatus, string> = {
  agendada: colors.neutral,
  aguardando_liberacao: colors.warn,
  em_validacao: colors.info,
  validada: colors.ok,
  validada_com_ressalvas: colors.warn,
  reprovada: colors.bad,
  cancelada: colors.neutral,
};

export default function MetricsScreen() {
  const metrics = useMetricsData(30);
  const [filter, setFilter] = useState<MetricsFilter>('all');
  const d = metrics.data;

  const windows = new Map(d?.changes.map((c) => [c.id, c.window_start]) ?? []);
  const cfr = d ? changeFailureRate(d.changes, d.incidents, filter) : null;
  const mttr = d ? meanTimeToRestore(d.incidents, windows, filter) : null;
  const changes = d?.changes.filter((c) => matchesFilter(c.window_start, filter)) ?? [];
  const byStatus = countBy(changes, (c) => c.status);
  const incidents =
    d?.incidents.filter((i) =>
      matchesFilter((i.change_id && windows.get(i.change_id)) || i.opened_at, filter),
    ) ?? [];
  const bySeverity = countBy(incidents, (i) => i.severity);
  const now = new Date();
  const byAge = countBy(d?.openFollowUps ?? [], (f) => ageBucket(f.created_at, now));

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={metrics.isRefetching}
          onRefresh={() => void metrics.refetch()}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <Text style={styles.intro}>
        Inspiradas em DORA/SRE · últimos 30 dias · filtro pela data da janela da GMUD.
      </Text>
      <View style={styles.chips}>
        {filters.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {metrics.isPending ? (
        <>
          <Skeleton height={120} />
          <Skeleton height={200} />
        </>
      ) : metrics.isError ? (
        <ErrorState message={metrics.error.message} onRetry={() => void metrics.refetch()} />
      ) : cfr && mttr ? (
        <>
          <View style={styles.kpis}>
            <Card style={styles.kpi}>
              <View style={styles.kpiHead}>
                <Gauge size={16} color={colors.muted} strokeWidth={1.8} />
                <Text style={styles.kpiLabel}>Taxa de falha</Text>
              </View>
              <Text
                style={[
                  styles.kpiValue,
                  { color: (cfr.rate ?? 0) > 0.15 ? colors.badText : colors.okText },
                ]}
              >
                {formatRate(cfr.rate)}
              </Text>
              <Text style={styles.kpiMeta}>
                {cfr.failed} de {cfr.finalized} GMUDs finalizadas
              </Text>
            </Card>
            <Card style={styles.kpi}>
              <View style={styles.kpiHead}>
                <Timer size={16} color={colors.muted} strokeWidth={1.8} />
                <Text style={styles.kpiLabel}>MTTR</Text>
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>
                {formatDuration(mttr.minutes)}
              </Text>
              <Text style={styles.kpiMeta}>{mttr.resolved} ocorrência(s) resolvida(s)</Text>
            </Card>
          </View>
          <Text style={styles.formula}>
            Falha = reprovadas + com ressalvas + GMUDs com ocorrência vinculada, ÷ finalizadas. MTTR
            = média de (resolvida − aberta).
          </Text>

          <SectionHeader title="GMUDs por status" count={changes.length} />
          <Card>
            <BarList
              bars={(Object.keys(changeStatusTone) as ChangeStatus[])
                .filter((s) => byStatus[s])
                .map((s) => ({
                  label: changeStatusTone[s].label,
                  value: byStatus[s] ?? 0,
                  color: statusColor[s],
                }))}
            />
          </Card>

          <SectionHeader title="Ocorrências por severidade" count={incidents.length} />
          <Card>
            <BarList
              bars={(['sev1', 'sev2', 'sev3', 'sev4'] as const).map((s) => ({
                label: s.toUpperCase(),
                value: bySeverity[s] ?? 0,
                color: s === 'sev3' ? colors.warn : s === 'sev4' ? colors.neutral : colors.bad,
              }))}
            />
          </Card>

          <SectionHeader title="Pendências abertas por idade" count={d?.openFollowUps.length} />
          <Card>
            <BarList
              bars={(['< 1 dia', '1–3 dias', '> 3 dias'] as AgeBucket[]).map((b) => ({
                label: b,
                value: byAge[b] ?? 0,
                color:
                  b === '> 3 dias' ? colors.bad : b === '1–3 dias' ? colors.warn : colors.neutral,
              }))}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.bodySmall, color: colors.muted },
  chips: { flexDirection: 'row', gap: spacing.sm },
  kpis: { flexDirection: 'row', gap: spacing.md },
  kpi: { flex: 1, gap: spacing.xs },
  kpiHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  kpiLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  kpiValue: { fontFamily: fonts.semibold, fontSize: 30, letterSpacing: -0.6 },
  kpiMeta: { ...typography.meta, color: colors.muted },
  formula: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim },
});
