import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CalendarRange, ListTodo, PhoneCall, Share2, Siren } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';

import { FollowUpRow } from '@/components/domain/FollowUpRow';
import { SeverityBadge } from '@/components/domain/IncidentBadges';
import { ShiftKindTag } from '@/components/domain/ShiftBadges';
import { ChangeStatusBadge } from '@/components/domain/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useAssignFromList } from '@/hooks/useFollowUps';
import { usePeriodSummary } from '@/hooks/usePeriod';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import { last24h, lastWeekend, type Period } from '@/utils/calendar';
import { formatShortDateTime, formatTime } from '@/utils/format';
import { periodSummaryToText } from '@/utils/periodSummary';

type Preset = 'weekend' | '24h';
const presets: Record<Preset, { label: string; title: string; make: (now: Date) => Period }> = {
  weekend: { label: 'Último fim de semana', title: 'Resumo do fim de semana', make: lastWeekend },
  '24h': { label: 'Últimas 24h', title: 'Resumo das últimas 24h', make: last24h },
};

function Total({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.total} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.totalValue, { color }]}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

export default function PeriodSummaryScreen() {
  const params = useLocalSearchParams<{ period?: string }>();
  const [preset, setPreset] = useState<Preset>(params.period === '24h' ? '24h' : 'weekend');
  // Computed once per preset choice so the query key stays stable.
  const [period, setPeriod] = useState<Period>(() => presets[preset].make(new Date()));
  const summary = usePeriodSummary(period);
  const assign = useAssignFromList();
  const { data: profile } = useProfile();

  function choose(p: Preset) {
    setPreset(p);
    setPeriod(presets[p].make(new Date()));
  }

  const s = summary.data;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={summary.isRefetching}
          onRefresh={() => void summary.refetch()}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <Stack.Screen options={{ title: 'Resumo do período' }} />
      <View style={styles.chips}>
        {(Object.keys(presets) as Preset[]).map((k) => (
          <Chip
            key={k}
            label={presets[k].label}
            selected={preset === k}
            onPress={() => choose(k)}
          />
        ))}
      </View>
      <View style={styles.range}>
        <CalendarRange size={14} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.mono}>
          {formatShortDateTime(period.from)} → {formatShortDateTime(period.to)}
        </Text>
      </View>

      {summary.isPending ? (
        <>
          <Skeleton height={90} />
          <Skeleton height={200} />
        </>
      ) : summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={() => void summary.refetch()} />
      ) : s ? (
        <>
          <Card style={styles.totals}>
            <Total label="GMUDs" value={s.totals.changes} color={colors.text} />
            <Total label="Validadas" value={s.totals.validated} color={colors.okText} />
            <Total label="Ressalvas" value={s.totals.withCaveats} color={colors.warnText} />
            <Total label="Reprovadas" value={s.totals.failed} color={colors.badText} />
          </Card>
          <Card style={styles.totals}>
            <Total label="Ocorrências" value={s.totals.incidents} color={colors.badText} />
            <Total label="Sem resposta" value={s.totals.unansweredCalls} color={colors.warnText} />
            <Total label="Pendências" value={s.totals.openFollowUps} color={colors.warnText} />
          </Card>
          <Button
            label="Compartilhar resumo"
            icon={Share2}
            variant="secondary"
            onPress={() =>
              void Share.share({ message: periodSummaryToText(s, presets[preset].title) })
            }
          />

          <SectionHeader title="GMUDs por turno" count={s.totals.changes} />
          {s.groups.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="Nada no período"
              description="Nenhuma GMUD ou turno registrado neste intervalo."
            />
          ) : (
            s.groups.map((g) => (
              <Card key={g.shift?.id ?? 'none'} style={styles.group}>
                {g.shift ? (
                  <View style={styles.groupHead}>
                    <ShiftKindTag kind={g.shift.kind} />
                    <Text style={styles.groupMeta}>
                      {g.shift.authorName ?? '—'} · {formatShortDateTime(g.shift.started_at)}
                      {g.shift.ended_at ? ` → ${formatTime(g.shift.ended_at)}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.groupMeta}>Fora de turno registrado</Text>
                )}
                {g.changes.length === 0 ? (
                  <Text style={styles.dim}>Sem GMUDs neste turno.</Text>
                ) : null}
                {g.changes.map((c) => (
                  <Card
                    key={c.id}
                    style={styles.change}
                    onPress={() => router.push({ pathname: '/changes/[id]', params: { id: c.id } })}
                  >
                    <View style={styles.top}>
                      <Text style={styles.mono}>{c.change_number}</Text>
                      <ChangeStatusBadge status={c.status} />
                    </View>
                    <Text style={styles.body}>{c.title}</Text>
                    <Text style={styles.dim}>
                      {formatShortDateTime(c.window_start)} · {c.apps.map((a) => a.name).join(', ')}
                    </Text>
                  </Card>
                ))}
              </Card>
            ))
          )}

          {s.apps.length ? (
            <>
              <SectionHeader title="Resultado por aplicação" />
              <Card style={styles.group}>
                {s.apps.map((a) => (
                  <View key={a.name} style={styles.top}>
                    <Text style={styles.body}>{a.name}</Text>
                    <Text style={styles.mono}>
                      <Text style={{ color: colors.okText }}>{a.approved}✓</Text>
                      {'  '}
                      <Text style={{ color: a.failed ? colors.badText : colors.dim }}>
                        {a.failed}✗
                      </Text>
                      {a.pending ? (
                        <Text style={{ color: colors.warnText }}>{`  ${a.pending} pend.`}</Text>
                      ) : null}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <SectionHeader title="Ocorrências" count={s.incidents.length} />
          {s.incidents.length ? (
            s.incidents.map((i) => (
              <Card
                key={i.id}
                style={styles.row}
                onPress={() => router.push({ pathname: '/incidents/[id]', params: { id: i.id } })}
              >
                <Siren
                  size={16}
                  color={i.status === 'resolvida' ? colors.okText : colors.badText}
                  strokeWidth={1.8}
                />
                <View style={styles.flex}>
                  <Text style={styles.body}>{i.title}</Text>
                  <Text style={styles.mono}>
                    {[
                      i.external_ticket,
                      i.appName,
                      i.status === 'resolvida' ? 'resolvida' : 'aberta',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <SeverityBadge severity={i.severity} />
              </Card>
            ))
          ) : (
            <Text style={styles.dim}>Nenhuma ocorrência no período.</Text>
          )}

          {s.calls.length ? (
            <>
              <SectionHeader
                title="Acionamentos sem resposta"
                count={s.calls.length}
                countTone="warn"
              />
              {s.calls.map((c) => (
                <Card
                  key={`${c.incidentId}-${c.createdAt}`}
                  style={styles.row}
                  onPress={() =>
                    router.push({ pathname: '/incidents/[id]', params: { id: c.incidentId } })
                  }
                >
                  <PhoneCall size={16} color={colors.warnText} strokeWidth={1.8} />
                  <View style={styles.flex}>
                    <Text style={styles.body}>
                      {[c.contact, c.channel].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.mono}>
                      {c.ticket ?? 'Sem INC'} · desde {formatShortDateTime(c.createdAt)}
                    </Text>
                  </View>
                </Card>
              ))}
            </>
          ) : null}

          <SectionHeader
            title="Pendências abertas"
            count={s.followUps.length}
            countTone={s.followUps.length ? 'warn' : 'neutral'}
          />
          {s.followUps.length && profile ? (
            s.followUps.map((f) => (
              <FollowUpRow
                key={f.id}
                followUp={f}
                currentUserId={profile.id}
                onPress={() => router.push({ pathname: '/follow-ups/[id]', params: { id: f.id } })}
                onAssign={() =>
                  assign.mutate(f.id, {
                    onSuccess: () => {
                      toast('Pendência assumida');
                      void summary.refetch();
                    },
                    onError: (e) => Alert.alert('Erro', e.message),
                  })
                }
              />
            ))
          ) : (
            <View style={styles.row}>
              <ListTodo size={16} color={colors.okText} strokeWidth={1.8} />
              <Text style={styles.dim}>Nenhuma pendência aberta.</Text>
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: spacing.sm },
  range: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  totals: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { flex: 1, alignItems: 'center', gap: 2 },
  totalValue: { fontFamily: fonts.semibold, fontSize: 24 },
  totalLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  group: { gap: spacing.md },
  groupHead: { gap: spacing.xs },
  groupMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  change: { gap: spacing.xs, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  body: { ...typography.bodySmall, color: colors.text, flexShrink: 1 },
  dim: { ...typography.meta, color: colors.dim },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
});
