import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, typography } from '@/theme';

type SectionHeaderProps = {
  title: string;
  /** Small count pill next to the title. */
  count?: number;
  countTone?: 'warn' | 'neutral';
  /** Right side: a link action or any custom node. */
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
};

export function SectionHeader({
  title,
  count,
  countTone = 'neutral',
  actionLabel,
  onAction,
  right,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {count !== undefined ? (
          <View style={[styles.pill, countTone === 'warn' ? styles.pillWarn : styles.pillNeutral]}>
            <Text
              style={[
                styles.pillText,
                { color: countTone === 'warn' ? colors.warnText : colors.neutralText },
              ]}
            >
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.section, color: colors.muted },
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pillWarn: { backgroundColor: colors.warnSoft },
  pillNeutral: { backgroundColor: colors.neutralSoft },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 11 },
  action: { fontFamily: fonts.medium, fontSize: 14, color: colors.brandPrimaryText },
});
