import type { LucideIcon } from 'lucide-react-native';
import { Inbox, RefreshCw, TriangleExclamationPoint } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
};

/** Empty list with a suggested next action. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <Icon size={28} color={colors.dim} strokeWidth={1.6} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

type ErrorStateProps = { message: string; onRetry: () => void };

/** Error with "Tentar novamente". */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <TriangleExclamationPoint size={28} color={colors.badText} strokeWidth={1.6} />
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.description}>{message}</Text>
      <Button label="Tentar novamente" onPress={onRetry} variant="secondary" icon={RefreshCw} />
    </View>
  );
}

/** Pulsing placeholder block used while data loads. */
export function Skeleton({ height = 72 }: { height?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View accessibilityLabel="Carregando" style={[styles.skeleton, { height, opacity }]} />
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  description: { ...typography.bodySmall, color: colors.muted, textAlign: 'center' },
  skeleton: {
    backgroundColor: colors.surface2,
    borderRadius: radius.card,
  },
});
