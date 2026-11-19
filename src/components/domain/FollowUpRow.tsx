import { UserCheck, UserPlus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { HomeFollowUp } from '@/services/home';
import { colors, fonts, hitTarget, radius, spacing } from '@/theme';
import { shiftKindLabel } from '@/utils/shiftKind';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

function originLabel(f: HomeFollowUp): string {
  const parts: string[] = [];
  if (f.sourceLabel) parts.push(f.sourceLabel);
  else if (f.appShortName) parts.push(f.appShortName);
  if (f.shiftStartedAt && f.shiftKind) {
    const day = DAYS[new Date(new Date(f.shiftStartedAt).getTime() - 3 * 3_600_000).getUTCDay()];
    parts.push(`${day} · ${shiftKindLabel[f.shiftKind].toLowerCase()}`);
  }
  return parts.join(' · ');
}

type Props = {
  followUp: HomeFollowUp;
  currentUserId: string;
  onAssign: () => void;
};

export function FollowUpRow({ followUp, currentUserId, onAssign }: Props) {
  const mine = followUp.assignedTo === currentUserId;
  const other = followUp.assignedTo !== null && !mine;
  const origin = originLabel(followUp);

  return (
    <Card style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.title}>{followUp.title}</Text>
        {origin ? <Text style={styles.meta}>{origin}</Text> : null}
        {other && followUp.assigneeName ? (
          <Text style={styles.assignee}>Com {followUp.assigneeName}</Text>
        ) : null}
      </View>
      {mine ? (
        <View style={styles.mine} accessibilityLabel="Pendência com você">
          <UserCheck size={16} color={colors.okText} strokeWidth={2} />
          <Text style={styles.mineText}>Com você</Text>
        </View>
      ) : other ? null : (
        <Pressable
          onPress={onAssign}
          accessibilityRole="button"
          accessibilityLabel={`Assumir pendência: ${followUp.title}`}
          style={({ pressed }) => [styles.assign, pressed && styles.pressed]}
        >
          <UserPlus size={16} color={colors.text} strokeWidth={1.8} />
          <Text style={styles.assignText}>Assumir</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  assignee: { fontFamily: fonts.medium, fontSize: 12, color: colors.infoText },
  assign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: hitTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderHi,
  },
  pressed: { backgroundColor: colors.surface2 },
  assignText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  mine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: hitTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.okSoft,
  },
  mineText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.okText },
});
