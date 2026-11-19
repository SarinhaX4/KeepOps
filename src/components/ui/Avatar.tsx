import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';
import { initials } from '@/utils/format';

type AvatarProps = { name: string; color: string; size?: number };

export function Avatar({ name, color, size = 44 }: AvatarProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
      ]}
    >
      <Text style={[styles.text, { color }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: colors.surface2,
  },
  text: { fontFamily: fonts.semibold, fontSize: 15 },
});
