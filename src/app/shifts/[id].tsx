import { Stack, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Share2 } from 'lucide-react-native';
import { Alert, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';

import { HandoverView } from '@/components/domain/HandoverView';
import { ShiftKindTag, ShiftStatusBadge } from '@/components/domain/ShiftBadges';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useProfile } from '@/hooks/useProfile';
import { useReceiveShift, useShift } from '@/hooks/useShifts';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatShortDateTime } from '@/utils/format';
import { handoverToText, isHandover } from '@/utils/handover';
import { shiftKindLabel } from '@/utils/shiftKind';

export default function HandoverDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shift = useShift(id);
  const receive = useReceiveShift();
  const { data: profile } = useProfile();

  const s = shift.data;
  const snapshot = s && isHandover(s.handover_snapshot) ? s.handover_snapshot : null;
  const canReceive = s?.status === 'encerrado' && s.user_id !== profile?.id;

  function shareText(): string {
    if (snapshot) return handoverToText(snapshot);
    if (!s) return '';
    // Records created by the demo seed carry only notes, not a full snapshot.
    return [
      '*Passagem de plantão — KeepOps*',
      `Turno ${shiftKindLabel[s.kind].toLowerCase()} · ${s.authorName ?? ''}`,
      s.notes ? `\n*Observações*\n${s.notes}` : '',
      s.next_steps ? `\n*Próximos passos*\n${s.next_steps}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  function confirmReceive() {
    Alert.alert(
      'Confirmar recebimento?',
      'Você declara que leu a passagem e assume o turno com as pendências listadas.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () =>
            receive.mutate(id, {
              onSuccess: () => toast('Recebimento confirmado'),
              onError: (e) => Alert.alert('Erro', e.message),
            }),
        },
      ],
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={shift.isRefetching}
          onRefresh={() => void shift.refetch()}
          tintColor={colors.brandPrimary}
        />
      }
    >
      <Stack.Screen options={{ title: 'Passagem de plantão' }} />
      {shift.isPending ? (
        <>
          <Skeleton height={120} />
          <Skeleton height={240} />
        </>
      ) : shift.isError || !s ? (
        <ErrorState
          message={shift.error?.message ?? 'Passagem não encontrada.'}
          onRetry={() => void shift.refetch()}
        />
      ) : (
        <>
          <View style={styles.head}>
            <View style={styles.top}>
              <ShiftKindTag kind={s.kind} />
              <ShiftStatusBadge status={s.status} />
            </View>
            <Text style={styles.title}>{s.authorName ?? 'Plantonista'}</Text>
            <Text style={styles.mono}>
              {formatShortDateTime(s.started_at)} →{' '}
              {s.ended_at ? formatShortDateTime(s.ended_at) : 'em andamento'}
            </Text>
            {s.status === 'recebido' && s.received_at ? (
              <View style={styles.received}>
                <CircleCheck size={16} color={colors.okText} strokeWidth={2} />
                <Text style={styles.receivedText}>
                  Recebida por {s.receiverName ?? '—'} · {formatShortDateTime(s.received_at)}
                </Text>
              </View>
            ) : null}
          </View>

          {canReceive ? (
            <Button
              label="Confirmar recebimento"
              icon={CircleCheck}
              onPress={confirmReceive}
              loading={receive.isPending}
            />
          ) : null}
          <Button
            label="Compartilhar"
            icon={Share2}
            variant="secondary"
            onPress={() => void Share.share({ message: shareText() })}
          />

          {snapshot ? (
            <HandoverView handover={snapshot} />
          ) : (
            <Text style={styles.legacy}>
              Registro demonstrativo: esta passagem traz apenas observações e próximos passos.
            </Text>
          )}

          {(snapshot?.notes ?? s.notes) ? (
            <>
              <SectionHeader title="Observações" />
              <Card>
                <Text style={styles.body}>{snapshot?.notes ?? s.notes}</Text>
              </Card>
            </>
          ) : null}
          {(snapshot?.nextSteps ?? s.next_steps) ? (
            <>
              <SectionHeader title="Próximos passos" />
              <Card>
                <Text style={styles.body}>{snapshot?.nextSteps ?? s.next_steps}</Text>
              </Card>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.muted },
  received: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  receivedText: { fontFamily: fonts.medium, fontSize: 13, color: colors.okText },
  legacy: { ...typography.bodySmall, color: colors.dim },
  body: { ...typography.bodySmall, color: colors.text },
});
