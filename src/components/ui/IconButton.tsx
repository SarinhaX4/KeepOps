import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, hitTarget, radius } from '@/theme';

type IconButtonProps = { icon: LucideIcon; label: string; onPress: () => void };

/** Square icon-only button; `label` is read by screen readers. */
export function IconButton({ icon: Icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Icon size={20} color={colors.text} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: hitTarget,
    height: hitTarget,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surface2 },
});
