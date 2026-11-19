import { Activity, Link } from 'lucide-react-native';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useApplicationsWithLastCheck } from '@/hooks/useApplications';
import type { Enums } from '@/types/database';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { formatRelative } from '@/utils/format';

const criticality: Record<Enums<'app_criticality'>, { label: string; fg: string; bg: string }> = {
  alta: { label: 'Criticidade alta', fg: colors.badText, bg: colors.badSoft },
  media: { label: 'Criticidade média', fg: colors.warnText, bg: colors.warnSoft },
  baixa: { label: 'Criticidade baixa', fg: colors.neutralText, bg: colors.neutralSoft },
};

export default function ApplicationsScreen() {
  const apps = useApplicationsWithLastCheck();

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={apps.isRefetching}
          onRefresh={() => void apps.refetch()}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <Text style={styles.intro}>
        Catálogo de aplicações e roteiros de validação. Endpoints de health check são simulados.
      </Text>
      {apps.isPending ? (
        <>
          <Skeleton height={110} />
          <Skeleton height={110} />
        </>
      ) : apps.isError ? (
        <ErrorState message={apps.error.message} onRetry={() => void apps.refetch()} />
      ) : apps.data.length === 0 ? (
        <EmptyState
          title="Nenhuma aplicação"
          description="Rode o seed para criar o catálogo demonstrativo."
        />
      ) : (
        apps.data.map((app) => {
          const crit = criticality[app.criticality];
          const check = app.lastCheck;
          return (
            <Card key={app.id} style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.name}>{app.name}</Text>
                <Text style={styles.short}>{app.short_name}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: crit.bg }]}>
                <Text style={[styles.badgeText, { color: crit.fg }]}>{crit.label}</Text>
              </View>
              {app.health_url ? (
                <View style={styles.row}>
                  <Link size={13} color={colors.dim} strokeWidth={1.8} />
                  <Text style={styles.url} numberOfLines={1}>
                    {app.health_url}
                  </Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Activity
                  size={13}
                  color={check ? (check.ok ? colors.okText : colors.badText) : colors.dim}
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.meta,
                    check && { color: check.ok ? colors.okText : colors.badText },
                  ]}
                >
                  {check
                    ? `${check.ok ? 'Disponível' : 'Indisponível'} · HTTP ${check.http_status ?? '—'} · ${check.latency_ms ?? '—'} ms · ${formatRelative(check.checked_at)}`
                    : 'Sem health check registrado'}
                </Text>
              </View>
              <Text style={styles.meta}>Roteiro: {app.stepCount} passos</Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.bodySmall, color: colors.muted },
  card: { gap: spacing.sm },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { ...typography.title, color: colors.text, flex: 1 },
  short: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.chip,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  url: { fontFamily: fonts.mono, fontSize: 12, color: colors.dim, flex: 1 },
  meta: { ...typography.meta, color: colors.muted, flexShrink: 1 },
});
