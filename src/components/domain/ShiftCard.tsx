import { CalendarDays, Moon, Play, Sun, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useNow } from '@/hooks/useNow';
import type { Shift } from '@/services/shifts';
import { colors, fonts, spacing } from '@/theme';
import { formatElapsed, formatTime } from '@/utils/format';
import { shiftKindLabel, type ShiftKind } from '@/utils/shiftKind';

export const shiftKindIcon: Record<ShiftKind, LucideIcon> = {
  noturno: Moon,
  diurno: Sun,
  fim_de_semana: CalendarDays,
};

function PulsingDot() {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
      <View style={styles.dot} />
    </View>
  );
}

function ShiftTimer({ startedAt }: { startedAt: string }) {
  const now = useNow(1000);
  return (
    <Text
      style={styles.timer}
      accessibilityLabel={`Tempo de turno ${formatElapsed(startedAt, now)}`}
    >
      {formatElapsed(startedAt, now)}
    </Text>
  );
}

export function OpenShiftCard({ shift }: { shift: Shift }) {
  const KindIcon = shiftKindIcon[shift.kind];
  const label =
    shift.kind === 'fim_de_semana'
      ? 'Turno de fim de semana'
      : `Turno ${shiftKindLabel[shift.kind].toLowerCase()}`;
  return (
    <Card style={styles.row}>
      <PulsingDot />
      <View style={styles.flex}>
        <Text style={styles.title}>{label} em andamento</Text>
        <View style={styles.meta}>
          <KindIcon size={13} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.metaText}>Desde {formatTime(shift.started_at)}</Text>
        </View>
      </View>
      <ShiftTimer startedAt={shift.started_at} />
    </Card>
  );
}

type StartShiftCardProps = { suggested: ShiftKind; onStart: () => void; loading: boolean };

export function StartShiftCard({ suggested, onStart, loading }: StartShiftCardProps) {
  const KindIcon = shiftKindIcon[suggested];
  return (
    <Card style={styles.startCard}>
      <View style={styles.meta}>
        <KindIcon size={14} color={colors.muted} strokeWidth={1.8} />
        <Text style={styles.metaText}>
          Nenhum turno aberto · sugerido: {shiftKindLabel[suggested]}
        </Text>
      </View>
      <Button label="Iniciar turno" icon={Play} onPress={onStart} loading={loading} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  timer: { fontFamily: fonts.monoSemibold, fontSize: 17, color: colors.text },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.okSoft,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ok },
  startCard: { gap: spacing.md },
});
