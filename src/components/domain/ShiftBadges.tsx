import { CircleCheck, Hourglass, Radio } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { Enums } from '@/types/database';
import { colors, fonts, radius, spacing } from '@/theme';
import { shiftKindLabel } from '@/utils/shiftKind';

import { shiftKindIcon } from './ShiftCard';

const statusTone = {
  aberto: { label: 'Em andamento', icon: Radio, fg: colors.infoText, bg: colors.infoSoft },
  encerrado: {
    label: 'Aguardando recebimento',
    icon: Hourglass,
    fg: colors.warnText,
    bg: colors.warnSoft,
  },
  recebido: { label: 'Recebida', icon: CircleCheck, fg: colors.okText, bg: colors.okSoft },
} as const;

export function ShiftStatusBadge({ status }: { status: Enums<'shift_status'> }) {
  const t = statusTone[status];
  const Icon = t.icon;
  return (
    <View
      style={[styles.badge, { backgroundColor: t.bg }]}
      accessibilityLabel={`Passagem: ${t.label}`}
    >
      <Icon size={13} color={t.fg} strokeWidth={2} />
      <Text style={[styles.label, { color: t.fg }]}>{t.label}</Text>
    </View>
  );
}

/** Discreet shift-kind seal: moon / sun / calendar (never conflicts with status colors). */
export function ShiftKindTag({ kind }: { kind: Enums<'shift_kind'> }) {
  const Icon = shiftKindIcon[kind];
  return (
    <View style={styles.tag}>
      <Icon size={13} color={colors.muted} strokeWidth={1.8} />
      <Text style={styles.tagText}>{shiftKindLabel[kind]}</Text>
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
  tag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tagText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
});
