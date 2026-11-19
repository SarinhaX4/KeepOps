import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  Ban,
  CalendarClock,
  CircleCheck,
  CircleX,
  Hourglass,
  TriangleExclamationPoint,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { ChangeStatus } from '@/services/changes';
import { colors, fonts, radius, spacing } from '@/theme';

type Tone = { label: string; icon: LucideIcon; fg: string; bg: string };

/** Status semantics (never color alone): color + icon + text. */
export const changeStatusTone: Record<ChangeStatus, Tone> = {
  agendada: {
    label: 'Agendada',
    icon: CalendarClock,
    fg: colors.neutralText,
    bg: colors.neutralSoft,
  },
  aguardando_liberacao: {
    label: 'Aguardando liberação',
    icon: Hourglass,
    fg: colors.warnText,
    bg: colors.warnSoft,
  },
  em_validacao: { label: 'Em validação', icon: Activity, fg: colors.infoText, bg: colors.infoSoft },
  validada: { label: 'Validada', icon: CircleCheck, fg: colors.okText, bg: colors.okSoft },
  validada_com_ressalvas: {
    label: 'Com ressalvas',
    icon: TriangleExclamationPoint,
    fg: colors.warnText,
    bg: colors.warnSoft,
  },
  reprovada: { label: 'Reprovada', icon: CircleX, fg: colors.badText, bg: colors.badSoft },
  cancelada: { label: 'Cancelada', icon: Ban, fg: colors.neutralText, bg: colors.neutralSoft },
};

export function ChangeStatusBadge({ status }: { status: ChangeStatus }) {
  const tone = changeStatusTone[status];
  const Icon = tone.icon;
  return (
    <View
      style={[styles.badge, { backgroundColor: tone.bg }]}
      accessibilityLabel={`Status: ${tone.label}`}
    >
      <Icon size={13} color={tone.fg} strokeWidth={2} />
      <Text style={[styles.label, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.chip,
  },
  label: { fontFamily: fonts.medium, fontSize: 12 },
});
