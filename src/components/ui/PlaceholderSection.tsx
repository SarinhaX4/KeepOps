import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type PlaceholderSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Which stage of the schedule delivers this screen. */
  stage: string;
};

/**
 * Temporary card for tabs not built yet (Stage 0 scaffold).
 * Informational only: no buttons, so nothing is decorative.
 */
export function PlaceholderSection({
  icon: Icon,
  title,
  description,
  stage,
}: PlaceholderSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={22} color={colors.brandPrimaryText} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.stage}>{stage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.brandPrimarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.title, color: colors.text },
  description: { ...typography.bodySmall, color: colors.muted },
  stage: { ...typography.meta, color: colors.dim, marginTop: spacing.xs },
});
