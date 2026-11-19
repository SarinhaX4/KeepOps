import { Check, Minus, Slash, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Enums } from '@/types/database';
import { colors } from '@/theme';

type Result = Enums<'validation_result'>;

export const resultTone: Record<Result, { label: string; fg: string; bg: string }> = {
  aprovado: { label: 'Aprovado', fg: colors.okText, bg: colors.okSoft },
  reprovado: { label: 'Reprovado', fg: colors.badText, bg: colors.badSoft },
  na: { label: 'N/A', fg: colors.neutralText, bg: colors.neutralSoft },
  pendente: { label: 'Pendente', fg: colors.warnText, bg: colors.warnSoft },
};

const icons = { aprovado: Check, reprovado: X, na: Slash, pendente: Minus } as const;

export function ValidationResultIcon({ result }: { result: Result }) {
  const tone = resultTone[result];
  const Icon = icons[result];
  return (
    <View style={[styles.box, { backgroundColor: tone.bg }]} accessibilityLabel={tone.label}>
      <Icon size={14} color={tone.fg} strokeWidth={2.4} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
