import { CircleCheck, CircleX, Info } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/toast';
import { colors, fonts, radius, spacing } from '@/theme';

const tones = {
  success: { icon: CircleCheck, fg: colors.okText },
  error: { icon: CircleX, fg: colors.badText },
  info: { icon: Info, fg: colors.infoText },
} as const;

/** Global feedback toast ("Validação salva", "Acionamento registrado"). Mounted once in the root layout. */
export function Toast() {
  const { message, tone, key, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
        hide(),
      );
    }, 2400);
    return () => clearTimeout(t);
  }, [message, key, anim, hide]);

  if (!message) return null;
  const { icon: Icon, fg } = tones[tone];

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          top: insets.top + spacing.sm,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
          ],
        },
      ]}
    >
      <Icon size={18} color={fg} strokeWidth={2} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.control,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderHi,
  },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.text },
});
