import { CircleCheck, Eye, Siren } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { IncidentStatus, Severity } from '@/services/incidents';
import { colors, fonts, radius, spacing } from '@/theme';

/** SEV1/SEV2 are critical (red); SEV3 attention (amber); SEV4 neutral. */
export const severityTone: Record<Severity, { label: string; fg: string; bg: string }> = {
  sev1: { label: 'SEV1', fg: colors.badText, bg: colors.badSoft },
  sev2: { label: 'SEV2', fg: colors.badText, bg: colors.badSoft },
  sev3: { label: 'SEV3', fg: colors.warnText, bg: colors.warnSoft },
  sev4: { label: 'SEV4', fg: colors.neutralText, bg: colors.neutralSoft },
};

export const severityHint: Record<Severity, string> = {
  sev1: 'Indisponibilidade total',
  sev2: 'Funcionalidade crítica afetada',
  sev3: 'Impacto parcial',
  sev4: 'Baixo impacto',
};

const statusTone: Record<
  IncidentStatus,
  { label: string; icon: typeof Siren; fg: string; bg: string }
> = {
  aberta: { label: 'Aberta', icon: Siren, fg: colors.badText, bg: colors.badSoft },
  em_acompanhamento: {
    label: 'Em acompanhamento',
    icon: Eye,
    fg: colors.infoText,
    bg: colors.infoSoft,
  },
  resolvida: { label: 'Resolvida', icon: CircleCheck, fg: colors.okText, bg: colors.okSoft },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = severityTone[severity];
  return (
    <View
      style={[styles.badge, { backgroundColor: t.bg }]}
      accessibilityLabel={`Severidade ${t.label}: ${severityHint[severity]}`}
    >
      <Text style={[styles.mono, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const t = statusTone[status];
  const Icon = t.icon;
  return (
    <View
      style={[styles.badge, styles.row, { backgroundColor: t.bg }]}
      accessibilityLabel={`Status: ${t.label}`}
    >
      <Icon size={13} color={t.fg} strokeWidth={2} />
      <Text style={[styles.label, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.chip,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mono: { fontFamily: fonts.monoSemibold, fontSize: 12 },
  label: { fontFamily: fonts.medium, fontSize: 12 },
});
