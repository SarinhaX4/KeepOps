import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CheckCheck, CircleCheck, PhoneCall, RefreshCcw, StickyNote } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IncidentStatusBadge, SeverityBadge } from '@/components/domain/IncidentBadges';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useIncident, useIncidentActions } from '@/hooks/useIncidents';
import { useNow } from '@/hooks/useNow';
import type { IncidentEvent, IncidentEventKind } from '@/services/incidents';
import { toast } from '@/store/toast';
import { colors, fonts, hitTarget, radius, spacing, typography } from '@/theme';
import { formatMinutes, formatShortDateTime, formatTime, minutesSince } from '@/utils/format';

const CHANNELS = ['Telefone', 'Teams', 'E-mail', 'WhatsApp'] as const;

const kindStyle: Record<
  IncidentEventKind,
  { label: string; icon: typeof StickyNote; fg: string; bg: string }
> = {
  nota: { label: 'Nota', icon: StickyNote, fg: colors.neutralText, bg: colors.neutralSoft },
  acionamento: { label: 'Acionamento', icon: PhoneCall, fg: colors.warnText, bg: colors.warnSoft },
  atualizacao: { label: 'Atualização', icon: RefreshCcw, fg: colors.infoText, bg: colors.infoSoft },
  resolucao: { label: 'Resolução', icon: CircleCheck, fg: colors.okText, bg: colors.okSoft },
};

type Mode = 'nota' | 'acionamento' | 'resolucao' | null;

function EventRow({
  ev,
  now,
  onAnswered,
  canAnswer,
}: {
  ev: IncidentEvent;
  now: Date;
  onAnswered: () => void;
  canAnswer: boolean;
}) {
  const k = kindStyle[ev.kind];
  const Icon = k.icon;
  const waiting = ev.kind === 'acionamento' && !ev.responded_at;
  return (
    <View style={styles.event}>
      <View style={[styles.eventIcon, { backgroundColor: k.bg }]}>
        <Icon size={15} color={k.fg} strokeWidth={1.9} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.eventHead}>
          <Text style={{ color: k.fg }}>{k.label}</Text>
          <Text style={styles.eventTime}>
            {'  '}
            {formatShortDateTime(ev.created_at)}
            {ev.by ? ` · ${ev.by}` : ''}
          </Text>
        </Text>
        {ev.kind === 'acionamento' && (ev.channel || ev.contact) ? (
          <Text style={styles.eventMono}>
            {[ev.contact, ev.channel].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text style={styles.eventText}>{ev.description}</Text>
        {ev.kind === 'acionamento' ? (
          waiting ? (
            <View style={styles.waitRow}>
              <Text style={styles.waiting}>
                Sem resposta há {formatMinutes(minutesSince(ev.created_at, now))}
              </Text>
              {canAnswer ? (
                <Pressable
                  onPress={onAnswered}
                  accessibilityRole="button"
                  accessibilityLabel="Marcar acionamento como respondido"
                  style={({ pressed }) => [styles.answerBtn, pressed && styles.pressed]}
                >
                  <CheckCheck size={15} color={colors.text} strokeWidth={2} />
                  <Text style={styles.answerText}>Marcar como respondido</Text>
                </Pressable>
              ) : null}
            </View>
          ) : ev.responded_at ? (
            <Text style={styles.answered}>
              Respondido às {formatTime(ev.responded_at)} · em{' '}
              {formatMinutes(minutesSince(ev.created_at, new Date(ev.responded_at)))}
            </Text>
          ) : null
        ) : null}
      </View>
    </View>
  );
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const incident = useIncident(id);
  const actions = useIncidentActions(id);
  const now = useNow(30_000);

  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('Telefone');
  const [contact, setContact] = useState('');
  const [ticket, setTicket] = useState('');
  const [error, setError] = useState<string | undefined>();

  const data = incident.data;
  const resolved = data?.status === 'resolvida';
  const busy =
    actions.addNote.isPending ||
    actions.registerCall.isPending ||
    actions.resolve.isPending ||
    actions.markAnswered.isPending;

  function open(next: Mode) {
    setMode(next);
    setText('');
    setError(undefined);
    if (next === 'acionamento' && data) setContact('');
  }

  const fail = (e: Error) => Alert.alert('Erro', e.message);
  const closeWith = (msg: string) => () => {
    toast(msg);
    setMode(null);
  };

  function submit() {
    if (mode === 'acionamento') {
      if (contact.trim().length < 2) return setError('Informe quem foi acionado.');
      actions.registerCall.mutate(
        {
          channel,
          contact: contact.trim(),
          description: text.trim() || `Executor acionado via ${channel.toLowerCase()}.`,
          ticket,
        },
        { onSuccess: closeWith('Acionamento registrado'), onError: fail },
      );
    } else if (mode === 'nota') {
      if (text.trim().length < 3) return setError('Escreva a nota.');
      actions.addNote.mutate(text.trim(), {
        onSuccess: closeWith('Nota adicionada'),
        onError: fail,
      });
    } else if (mode === 'resolucao') {
      if (text.trim().length < 5) return setError('Descreva como foi resolvida.');
      Alert.alert(
        'Resolver ocorrência?',
        'Ela sai das ocorrências abertas e entra no cálculo do MTTR.',
        [
          { text: 'Voltar', style: 'cancel' },
          {
            text: 'Resolver',
            onPress: () =>
              actions.resolve.mutate(text.trim(), {
                onSuccess: closeWith('Ocorrência resolvida'),
                onError: fail,
              }),
          },
        ],
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={incident.isRefetching}
            onRefresh={() => void incident.refetch()}
            tintColor={colors.brandPrimary}
          />
        }
      >
        <Stack.Screen options={{ title: data?.external_ticket ?? 'Ocorrência' }} />
        {incident.isPending ? (
          <>
            <Skeleton height={140} />
            <Skeleton height={200} />
          </>
        ) : incident.isError || !data ? (
          <ErrorState
            message={incident.error?.message ?? 'Ocorrência não encontrada.'}
            onRetry={() => void incident.refetch()}
          />
        ) : (
          <>
            <View style={styles.head}>
              <View style={styles.badges}>
                <SeverityBadge severity={data.severity} />
                <IncidentStatusBadge status={data.status} />
              </View>
              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.mono}>
                {[data.external_ticket, data.appName].filter(Boolean).join(' · ')}
              </Text>
              {data.changeNumber && data.change_id ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/changes/[id]',
                      params: { id: data.change_id as string },
                    })
                  }
                  accessibilityRole="link"
                  hitSlop={8}
                >
                  <Text style={styles.link}>GMUD {data.changeNumber} →</Text>
                </Pressable>
              ) : null}
              <Text style={styles.meta}>
                Aberta {formatShortDateTime(data.opened_at)}
                {data.openerName ? ` por ${data.openerName}` : ''}
                {resolved && data.resolved_at
                  ? ` · resolvida em ${formatMinutes(minutesSince(data.opened_at, new Date(data.resolved_at)))}`
                  : ` · há ${formatMinutes(minutesSince(data.opened_at, now))}`}
              </Text>
            </View>

            {!resolved && mode === null ? (
              <View style={styles.actions}>
                <Button
                  label="Registrar acionamento"
                  icon={PhoneCall}
                  onPress={() => open('acionamento')}
                />
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Button
                      label="Adicionar nota"
                      icon={StickyNote}
                      variant="secondary"
                      onPress={() => open('nota')}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Button
                      label="Resolver"
                      icon={CircleCheck}
                      variant="secondary"
                      onPress={() => open('resolucao')}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {mode ? (
              <Card style={styles.composer}>
                <Text style={styles.composerTitle}>
                  {mode === 'acionamento'
                    ? 'Registrar acionamento'
                    : mode === 'nota'
                      ? 'Adicionar nota'
                      : 'Resolver ocorrência'}
                </Text>
                {mode === 'acionamento' ? (
                  <>
                    <View style={styles.chips}>
                      {CHANNELS.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={channel === c}
                          onPress={() => setChannel(c)}
                        />
                      ))}
                    </View>
                    <TextField
                      label="Quem foi acionado"
                      value={contact}
                      onChangeText={setContact}
                      placeholder="Ex.: Plantão Middleware (fornecedor)"
                      error={error}
                    />
                    {!data.external_ticket ? (
                      <TextField
                        label="INC (opcional)"
                        value={ticket}
                        onChangeText={setTicket}
                        mono
                        autoCapitalize="characters"
                        placeholder="INC0012346"
                      />
                    ) : null}
                  </>
                ) : null}
                <TextField
                  label={
                    mode === 'acionamento'
                      ? 'Detalhes (opcional)'
                      : mode === 'nota'
                        ? 'Nota'
                        : 'O que resolveu?'
                  }
                  value={text}
                  onChangeText={setText}
                  multiline
                  error={mode !== 'acionamento' ? error : undefined}
                />
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Button label="Cancelar" variant="ghost" onPress={() => setMode(null)} />
                  </View>
                  <View style={styles.flex}>
                    <Button label="Salvar" onPress={submit} loading={busy} />
                  </View>
                </View>
              </Card>
            ) : null}

            <SectionHeader title="Linha do tempo" count={data.events.length} />
            <Card style={styles.timeline}>
              {data.events.map((ev) => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  now={now}
                  canAnswer={!resolved}
                  onAnswered={() =>
                    actions.markAnswered.mutate(ev.id, {
                      onSuccess: () => toast('Acionamento respondido'),
                      onError: fail,
                    })
                  }
                />
              ))}
            </Card>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.brandPrimaryText },
  meta: { ...typography.meta, color: colors.muted },
  actions: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  composer: { gap: spacing.md, borderColor: colors.borderHi },
  composerTitle: { ...typography.title, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeline: { gap: spacing.lg },
  event: { flexDirection: 'row', gap: spacing.md },
  eventIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHead: { fontFamily: fonts.semibold, fontSize: 14 },
  eventTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.dim },
  eventMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 2 },
  eventText: { ...typography.bodySmall, color: colors.text, marginTop: 2 },
  waitRow: { gap: spacing.sm, marginTop: spacing.sm },
  waiting: { fontFamily: fonts.medium, fontSize: 13, color: colors.warnText },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    minHeight: hitTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderHi,
  },
  pressed: { backgroundColor: colors.surface2 },
  answerText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  answered: { fontFamily: fonts.mono, fontSize: 12, color: colors.okText, marginTop: spacing.xs },
});
