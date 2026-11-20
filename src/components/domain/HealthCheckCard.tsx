import { Activity } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ChangeDetail } from '@/services/changes';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatTime } from '@/utils/format';

type Check = ChangeDetail['checks'][number];

function Side({ title, check }: { title: string; check: Check | undefined }) {
  const tone = !check
    ? null
    : check.ok
      ? { fg: colors.okText, bg: colors.okSoft }
      : { fg: colors.badText, bg: colors.badSoft };
  return (
    <View style={[styles.side, tone && { backgroundColor: tone.bg }]}>
      <Text style={styles.sideTitle}>{title}</Text>
      {check ? (
        <>
          <Text style={[styles.status, { color: tone?.fg }]}>
            {check.http_status ? `HTTP ${check.http_status}` : 'Sem resposta'}
          </Text>
          <Text style={styles.mono}>
            {check.latency_ms != null ? `${check.latency_ms} ms` : '—'}
          </Text>
          <Text style={styles.time}>{formatTime(check.checked_at)}</Text>
        </>
      ) : (
        <Text style={styles.empty}>Não executado</Text>
      )}
    </View>
  );
}

type Props = {
  baseline: Check | undefined;
  post: Check | undefined;
  nextPhase: 'baseline' | 'pos';
  url: string | null;
  running: boolean;
  disabled: boolean;
  onRun: () => void;
};

/** Baseline × post-change side by side, plus "Executar check". */
export function HealthCheckCard({
  baseline,
  post,
  nextPhase,
  url,
  running,
  disabled,
  onRun,
}: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Activity size={16} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.title}>Health check HTTP</Text>
        <Text style={styles.simulated}>simulado</Text>
      </View>
      <View style={styles.sides}>
        <Side title="Baseline" check={baseline} />
        <Side title="Pós-mudança" check={post} />
      </View>
      {url ? (
        <Text style={styles.url} numberOfLines={1}>
          {url}
        </Text>
      ) : (
        <Text style={styles.url}>Aplicação sem URL de health check.</Text>
      )}
      <Button
        label={
          nextPhase === 'baseline' ? 'Executar check (baseline)' : 'Executar check (pós-mudança)'
        }
        variant="secondary"
        icon={Activity}
        onPress={onRun}
        loading={running}
        disabled={disabled || !url}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  simulated: { fontFamily: fonts.mono, fontSize: 11, color: colors.dim },
  sides: { flexDirection: 'row', gap: spacing.md },
  side: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideTitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  status: { fontFamily: fonts.monoSemibold, fontSize: 18 },
  mono: { fontFamily: fonts.mono, fontSize: 14, color: colors.text },
  time: { fontFamily: fonts.mono, fontSize: 11, color: colors.dim },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.dim, marginTop: spacing.xs },
  url: { fontFamily: fonts.mono, fontSize: 11, color: colors.dim },
});
