import { CircleCheck, UserCheck, UserPlus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { FollowUpItem } from '@/services/followUps';
import { colors, fonts, hitTarget, radius, spacing } from '@/theme';
import { formatRelative } from '@/utils/format';
import { shiftKindLabel } from '@/utils/shiftKind';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

function originLabel(f: FollowUpItem): string {
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
  followUp: FollowUpItem;
  currentUserId: string;
  onAssign: () => void;
  /** Opens the follow-up detail. */
  onPress?: () => void;
  /** Show the age ("há 2 d") — used on the Pendências tab. */
  showAge?: boolean;
};

export function FollowUpRow({
  followUp,
  currentUserId,
  onAssign,
  onPress,
  showAge = false,
}: Props) {
  const mine = followUp.assignedTo === currentUserId;
  const done = followUp.status === 'concluida';
  const other = followUp.assignedTo !== null && !mine;
  const origin = originLabel(followUp);

  return (
    <Card style={styles.row} onPress={onPress} accessibilityLabel={`Pendência: ${followUp.title}`}>
      <View style={styles.flex}>
        <Text style={styles.title}>{followUp.title}</Text>
        {origin ? <Text style={styles.meta}>{origin}</Text> : null}
        {other && followUp.assigneeName && !done ? (
          <Text style={styles.assignee}>Com {followUp.assigneeName}</Text>
        ) : null}
        {done && followUp.resolverName ? (
          <Text style={styles.resolved}>Concluída por {followUp.resolverName}</Text>
        ) : null}
        {showAge && !done ? (
          <Text style={styles.age}>Aberta {formatRelative(followUp.createdAt)}</Text>
        ) : null}
      </View>
      {done ? (
        <View style={styles.done} accessibilityLabel="Pendência concluída">
          <CircleCheck size={16} color={colors.okText} strokeWidth={2} />
        </View>
      ) : mine ? (
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
  resolved: { fontFamily: fonts.medium, fontSize: 12, color: colors.okText },
  age: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim },
  done: { width: hitTarget, height: hitTarget, alignItems: 'center', justifyContent: 'center' },
  mineText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.okText },
});
