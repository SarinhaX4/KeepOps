import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, hitTarget, radius, spacing } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  mono?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  mono = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.bad : focused ? colors.brandPrimary : colors.border;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.dim}
        selectionColor={colors.brandPrimary}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, mono && styles.mono, { borderColor }, style]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  input: {
    minHeight: hitTarget + 4,
    borderWidth: 1,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  mono: { fontFamily: fonts.mono },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.badText },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim },
});
