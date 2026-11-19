import { ChevronRight, Clock, Check, X, Minus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import type { HomeChange, HomeChangeApp } from '@/services/home';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { formatTime } from '@/utils/format';
import { validationProgress } from '@/utils/home';

import { ChangeStatusBadge } from './StatusBadge';

function AppRow({ app, last }: { app: HomeChangeApp; last: boolean }) {
  const p = validationProgress(app.results);
  const failed = p.failed > 0 || app.lastCheck?.ok === false;
  const complete = p.total > 0 && p.pending === 0;

  const tone = failed
    ? { icon: X, fg: colors.badText, bg: colors.badSoft, label: 'com falha' }
    : complete
      ? { icon: Check, fg: colors.okText, bg: colors.okSoft, label: 'aprovada' }
      : { icon: Minus, fg: colors.warnText, bg: colors.warnSoft, label: 'pendente' };
  const Icon = tone.icon;

  let value = `${p.approved}/${p.total}`;
  if (app.lastCheck?.ok === false && app.lastCheck.http_status)
    value = `HTTP ${app.lastCheck.http_status}`;
  else if (app.lastCheck?.latency_ms != null) value += ` · ${app.lastCheck.latency_ms} ms`;

  return (
    <View
      style={[styles.appRow, !last && styles.appDivider]}
      accessibilityLabel={`${app.name}: ${tone.label}, ${value}`}
    >
      <View style={[styles.appIcon, { backgroundColor: tone.bg }]}>
        <Icon size={14} color={tone.fg} strokeWidth={2.4} />
      </View>
      <Text style={styles.appName} numberOfLines={1}>
        {app.name}
      </Text>
      <Text style={[styles.appValue, { color: failed ? colors.badText : colors.muted }]}>
        {value}
      </Text>
    </View>
  );
}

type Props = { change: HomeChange; onContinue: () => void };

export function ValidationNowCard({ change, onContinue }: Props) {
  const all = validationProgress(change.apps.flatMap((a) => a.results));
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.number}>{change.change_number}</Text>
        <ChangeStatusBadge status={change.status} />
      </View>
      <Text style={styles.title}>{change.title}</Text>
      <View style={styles.meta}>
        <Clock size={13} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.metaText} numberOfLines={1}>
          {formatTime(change.window_start)} – {formatTime(change.window_end)}
          {change.executor_team ? ` · ${change.executor_team}` : ''}
        </Text>
      </View>

      <View style={styles.progressHead}>
        <Text style={styles.metaText}>Validação</Text>
        <Text style={styles.mono}>
          {all.done} de {all.total} passos
        </Text>
      </View>
      <SegmentedProgress
        ok={all.approved}
        failed={all.failed}
        neutral={all.notApplicable}
        total={all.total}
      />

      {change.apps.length > 0 ? (
        <View style={styles.apps}>
          {change.apps.map((a, i) => (
            <AppRow key={a.id} app={a} last={i === change.apps.length - 1} />
          ))}
        </View>
      ) : null}

      <Button label="Continuar validação" icon={ChevronRight} onPress={onContinue} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.muted },
  title: { ...typography.title, fontSize: 17, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginTop: -spacing.xs },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, flexShrink: 1 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  apps: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    backgroundColor: colors.bg,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 52,
  },
  appDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  appValue: { fontFamily: fonts.mono, fontSize: 13 },
});
