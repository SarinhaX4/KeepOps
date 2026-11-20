import { PhoneCall } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { IncidentListItem as Incident } from '@/services/incidents';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatMinutes, formatRelative, minutesSince } from '@/utils/format';

import { IncidentStatusBadge, SeverityBadge } from './IncidentBadges';

export function IncidentListItem({
  incident,
  onPress,
}: {
  incident: Incident;
  onPress: () => void;
}) {
  const open = incident.status !== 'resolvida';
  const meta = [incident.external_ticket, incident.appShortName, incident.changeNumber]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${incident.severity.toUpperCase()}: ${incident.title}`}
    >
      <View style={styles.top}>
        <SeverityBadge severity={incident.severity} />
        <IncidentStatusBadge status={incident.status} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {incident.title}
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      <View style={styles.bottom}>
        <Text style={styles.time}>
          {open
            ? `Aberta há ${formatMinutes(minutesSince(incident.opened_at))}`
            : `Resolvida ${incident.resolved_at ? formatRelative(incident.resolved_at) : ''}`}
        </Text>
        {incident.unansweredCalls > 0 ? (
          <View
            style={styles.calls}
            accessibilityLabel={`${incident.unansweredCalls} acionamento sem resposta`}
          >
            <PhoneCall size={13} color={colors.warnText} strokeWidth={2} />
            <Text style={styles.callsText}>{incident.unansweredCalls} sem resposta</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, color: colors.text },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { ...typography.meta, color: colors.muted },
  calls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  callsText: { fontFamily: fonts.medium, fontSize: 12, color: colors.warnText },
});
