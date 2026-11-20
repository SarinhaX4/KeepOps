import { Check, Slash, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ValidationResult } from '@/services/validations';
import { colors, fonts, hitTarget, radius, spacing } from '@/theme';

const options = [
  {
    value: 'aprovado',
    label: 'Aprovado',
    icon: Check,
    fg: colors.okText,
    bg: colors.okSoft,
    border: colors.ok,
  },
  {
    value: 'reprovado',
    label: 'Reprovado',
    icon: X,
    fg: colors.badText,
    bg: colors.badSoft,
    border: colors.bad,
  },
  {
    value: 'na',
    label: 'N/A',
    icon: Slash,
    fg: colors.neutralText,
    bg: colors.neutralSoft,
    border: colors.neutral,
  },
] as const;

type Props = {
  value: ValidationResult;
  onChange: (next: ValidationResult) => void;
  disabled?: boolean;
};

/**
 * Big 3-way control for a checklist step (thumb-friendly, ≥ 44 pt).
 * Tapping the selected option again returns the step to "pendente".
 */
export function SegmentedResult({ value, onChange, disabled = false }: Props) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = value === o.value;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.value}
            disabled={disabled}
            onPress={() => onChange(selected ? 'pendente' : o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={o.label}
            accessibilityHint={selected ? 'Toque de novo para voltar a pendente' : undefined}
            style={[
              styles.option,
              selected && { backgroundColor: o.bg, borderColor: o.border },
              disabled && styles.disabled,
            ]}
          >
            <Icon size={16} color={selected ? o.fg : colors.muted} strokeWidth={2.2} />
            <Text style={[styles.label, { color: selected ? o.fg : colors.muted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: hitTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
  disabled: { opacity: 0.5 },
});
