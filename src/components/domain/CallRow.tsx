import { PhoneCall } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { UnansweredCall } from '@/services/home';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatMinutes, minutesSince } from '@/utils/format';

/** Executor call still waiting for an answer (amber = attention). */
export function CallRow({
  call,
  now,
  onPress,
}: {
  call: UnansweredCall;
  now: Date;
  onPress: () => void;
}) {
  const elapsed = formatMinutes(minutesSince(call.createdAt, now));
  const who = [call.contact, call.channel?.toLowerCase()].filter(Boolean).join(' · ');
  const ref = [call.ticket, call.appName].filter(Boolean).join(' · ');
  return (
    <Card
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={`Acionamento sem resposta: ${call.contact ?? ''}`}
    >
      <View style={styles.icon}>
        <PhoneCall size={18} color={colors.warnText} strokeWidth={1.8} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.title} numberOfLines={2}>
          {who || 'Acionamento'}
        </Text>
        {ref ? <Text style={styles.meta}>{ref}</Text> : null}
      </View>
      <Text style={styles.elapsed} accessibilityLabel={`Sem resposta há ${elapsed}`}>
        {elapsed}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.warnSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  elapsed: { fontFamily: fonts.monoSemibold, fontSize: 14, color: colors.warnText },
});
