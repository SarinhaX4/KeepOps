import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AppearProps = { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> };

/**
 * Discreet entrance for cards and list items (spec: "microanimações discretas").
 * Short fade + 6 px rise, staggered by index (capped), honoring the OS reduce-motion setting.
 */
export function Appear({ children, index = 0, style }: AppearProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220)
        .delay(Math.min(index, 6) * 40)
        .withInitialValues({ transform: [{ translateY: 6 }] })}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
