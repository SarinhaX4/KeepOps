import { ListTodo, PhoneCall, Siren } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatTime } from '@/utils/format';
import { appSummary, type Handover } from '@/utils/handover';

import { SeverityBadge } from './IncidentBadges';
import { ChangeStatusBadge } from './StatusBadge';

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

/** Read-only handover sections (live preview or saved snapshot). */
export function HandoverView({ handover: h }: { handover: Handover }) {
  return (
    <View style={styles.wrap}>
      <Card style={styles.stats}>
        <Stat label="GMUDs" value={h.totals.changes} color={colors.text} />
        <Stat label="Validadas" value={h.totals.validated} color={colors.okText} />
        <Stat label="Reprovadas" value={h.totals.failed} color={colors.badText} />
        <Stat label="Em andamento" value={h.totals.inProgress} color={colors.infoText} />
      </Card>

      <SectionHeader title="GMUDs da janela" count={h.changes.length} />
      {h.changes.length ? (
        h.changes.map((c) => (
          <Card key={c.id} style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.mono}>{c.number}</Text>
              <ChangeStatusBadge status={c.status} />
            </View>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.meta}>
              {formatTime(c.windowStart)} – {formatTime(c.windowEnd)}
            </Text>
            {c.apps.map((a) => (
              <View key={a.name} style={styles.appRow}>
                <Text style={styles.appName}>{a.name}</Text>
                <Text
                  style={[styles.appValue, (a.failed > 0 || a.check?.ok === false) && styles.bad]}
                >
                  {appSummary(a)}
                </Text>
              </View>
            ))}
          </Card>
        ))
      ) : (
        <Empty text="Nenhuma GMUD na janela." />
      )}

      <SectionHeader title="Ocorrências" count={h.incidents.length} />
      {h.incidents.length ? (
        h.incidents.map((i) => (
          <Card key={i.id} style={styles.row}>
            <Siren
              size={16}
              color={i.status === 'resolvida' ? colors.okText : colors.badText}
              strokeWidth={1.8}
            />
            <View style={styles.flex}>
              <Text style={styles.body}>{i.title}</Text>
              <Text style={styles.mono}>
                {[i.ticket, i.appName, i.status === 'resolvida' ? 'resolvida' : 'aberta']
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <SeverityBadge severity={i.severity} />
          </Card>
        ))
      ) : (
        <Empty text="Nenhuma ocorrência." />
      )}

      {h.unansweredCalls.length ? (
        <>
          <SectionHeader
            title="Acionamentos sem resposta"
            count={h.unansweredCalls.length}
            countTone="warn"
          />
          {h.unansweredCalls.map((c) => (
            <Card key={`${c.incidentId}-${c.since}`} style={styles.row}>
              <PhoneCall size={16} color={colors.warnText} strokeWidth={1.8} />
              <View style={styles.flex}>
                <Text style={styles.body}>
                  {[c.contact, c.channel].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.mono}>
                  {c.ticket ?? 'Sem INC'} · desde {formatTime(c.since)}
                </Text>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      <SectionHeader
        title="Pendências abertas"
        count={h.followUps.length}
        countTone={h.followUps.length ? 'warn' : 'neutral'}
      />
      {h.followUps.length ? (
        h.followUps.map((f) => (
          <Card key={f.id} style={styles.row}>
            <ListTodo size={16} color={colors.warnText} strokeWidth={1.8} />
            <View style={styles.flex}>
              <Text style={styles.body}>{f.title}</Text>
              <Text style={styles.mono}>
                {[f.origin, f.assigneeName ?? 'sem responsável'].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Empty text="Nenhuma pendência aberta." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
  statValue: { fontFamily: fonts.semibold, fontSize: 24 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  card: { gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, color: colors.text },
  meta: { ...typography.meta, color: colors.muted },
  appRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  appName: { ...typography.bodySmall, color: colors.text, flex: 1 },
  appValue: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  bad: { color: colors.badText },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  body: { ...typography.bodySmall, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  empty: { ...typography.bodySmall, color: colors.dim },
});
