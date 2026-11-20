import { router } from 'expo-router';
import { ArrowRightLeft, LogOut, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HandoverView } from '@/components/domain/HandoverView';
import { ShiftKindTag, ShiftStatusBadge } from '@/components/domain/ShiftBadges';
import { OpenShiftCard, StartShiftCard } from '@/components/domain/ShiftCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useOpenShift, useStartShift } from '@/hooks/useHome';
import { useProfile } from '@/hooks/useProfile';
import {
  useCloseShift,
  useCurrentHandover,
  usePendingHandover,
  useSaveShiftDraft,
  useShiftHistory,
} from '@/hooks/useShifts';
import type { Shift } from '@/services/shifts';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatShortDateTime } from '@/utils/format';
import { handoverToText } from '@/utils/handover';
import { shiftKindLabel, suggestShiftKind, type ShiftKind } from '@/utils/shiftKind';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

type Tab = 'current' | 'history';

function CurrentShift({ shift }: { shift: Shift }) {
  const preview = useCurrentHandover();
  const close = useCloseShift();
  const saveDraft = useSaveShiftDraft();
  const [notes, setNotes] = useState(shift.notes ?? '');
  const [nextSteps, setNextSteps] = useState(shift.next_steps ?? '');

  const handover = preview.data
    ? { ...preview.data, notes: notes.trim(), nextSteps: nextSteps.trim() }
    : null;
  const persist = () => saveDraft.mutate({ id: shift.id, notes, nextSteps });

  function share() {
    if (!handover) return;
    void Share.share({ message: handoverToText(handover), title: 'Passagem de plantão — KeepOps' });
  }

  function confirmClose() {
    Alert.alert(
      'Encerrar turno e gerar passagem?',
      'A passagem é salva com o estado atual de GMUDs, ocorrências e pendências. Depois disso o próximo plantonista pode confirmar o recebimento.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Encerrar turno',
          style: 'destructive',
          onPress: () =>
            close.mutate(
              { notes, nextSteps },
              {
                onSuccess: (h) => {
                  toast('Passagem gerada');
                  router.push({ pathname: '/shifts/[id]', params: { id: h.shift.id } });
                },
                onError: (e) => Alert.alert('Erro', e.message),
              },
            ),
        },
      ],
    );
  }

  return (
    <>
      <OpenShiftCard shift={shift} />
      <SectionHeader
        title="Prévia da passagem"
        right={<Text style={styles.auto}>gerada automaticamente</Text>}
      />
      {preview.isPending ? (
        <>
          <Skeleton height={80} />
          <Skeleton height={160} />
        </>
      ) : preview.isError ? (
        <ErrorState message={preview.error.message} onRetry={() => void preview.refetch()} />
      ) : handover ? (
        <HandoverView handover={handover} />
      ) : null}

      <SectionHeader title="Para o próximo turno" />
      <TextField
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        onBlur={persist}
        multiline
        placeholder="Contexto que não está nos registros (ex.: executor pediu nova janela)."
      />
      <TextField
        label="Próximos passos"
        value={nextSteps}
        onChangeText={setNextSteps}
        onBlur={persist}
        multiline
        placeholder="Ex.: Revalidar API às 7h após restart do fornecedor."
      />
      <Button
        label="Compartilhar prévia"
        icon={Share2}
        variant="secondary"
        onPress={share}
        disabled={!handover}
      />
      <Button
        label="Encerrar turno e gerar passagem"
        icon={LogOut}
        onPress={confirmClose}
        loading={close.isPending}
      />
    </>
  );
}

function NoShift() {
  const { data: profile } = useProfile();
  const pending = usePendingHandover();
  const start = useStartShift();
  const isOnCall = profile?.role === 'plantonista';

  function askStart() {
    const suggested = suggestShiftKind(new Date());
    const kinds: ShiftKind[] = ['noturno', 'diurno', 'fim_de_semana'];
    const go = (kind: ShiftKind) =>
      start.mutate(kind, {
        onSuccess: () => toast('Turno iniciado'),
        onError: (e) => Alert.alert('Erro', e.message),
      });
    Alert.alert(
      'Iniciar turno',
      `Tipo sugerido: ${shiftKindLabel[suggested]}. Confirme ou ajuste.`,
      [
        ...kinds
          .filter((k) => k !== suggested)
          .map((k) => ({ text: shiftKindLabel[k], onPress: () => go(k) })),
        { text: `${shiftKindLabel[suggested]} (sugerido)`, onPress: () => go(suggested) },
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  return (
    <>
      {pending.data ? (
        <Card
          style={styles.pending}
          onPress={() =>
            router.push({ pathname: '/shifts/[id]', params: { id: pending.data?.id as string } })
          }
          accessibilityLabel="Passagem aguardando seu recebimento"
        >
          <ShiftStatusBadge status="encerrado" />
          <Text style={styles.pendingTitle}>
            Passagem de {pending.data.authorName ?? 'outro plantonista'} aguardando recebimento
          </Text>
          <Text style={styles.meta}>
            Encerrada {pending.data.ended_at ? formatShortDateTime(pending.data.ended_at) : ''} ·
            toque para ler e confirmar
          </Text>
        </Card>
      ) : null}
      {isOnCall ? (
        <StartShiftCard
          suggested={suggestShiftKind(new Date())}
          onStart={askStart}
          loading={start.isPending}
        />
      ) : (
        <EmptyState
          icon={ArrowRightLeft}
          title="Você não faz plantão"
          description="Como equipe da semana, acompanhe as passagens no Histórico e assuma as pendências."
        />
      )}
    </>
  );
}

function History() {
  const history = useShiftHistory();
  if (history.isPending)
    return (
      <>
        <Skeleton height={90} />
        <Skeleton height={90} />
      </>
    );
  if (history.isError)
    return <ErrorState message={history.error.message} onRetry={() => void history.refetch()} />;
  if (!history.data.length)
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="Nenhuma passagem ainda"
        description="As passagens aparecem aqui quando um turno é encerrado."
      />
    );
  return (
    <>
      {history.data.map((s) => (
        <Card
          key={s.id}
          style={styles.histCard}
          onPress={() => router.push({ pathname: '/shifts/[id]', params: { id: s.id } })}
          accessibilityLabel={`Passagem de ${s.authorName ?? ''}`}
        >
          <View style={styles.top}>
            <ShiftKindTag kind={s.kind} />
            <ShiftStatusBadge status={s.status} />
          </View>
          <Text style={styles.histTitle}>{s.authorName ?? 'Plantonista'}</Text>
          <Text style={styles.mono}>
            {formatShortDateTime(s.started_at)} →{' '}
            {s.ended_at ? formatShortDateTime(s.ended_at) : '—'}
          </Text>
          {s.receiverName ? <Text style={styles.meta}>Recebida por {s.receiverName}</Text> : null}
        </Card>
      ))}
    </>
  );
}

export default function ShiftsScreen() {
  const shift = useOpenShift();
  const history = useShiftHistory();
  const preview = useCurrentHandover();
  const [tab, setTab] = useState<Tab>('current');
  useRefreshOnFocus(() => Promise.all([shift.refetch(), history.refetch(), preview.refetch()]));

  const refreshing = shift.isRefetching || history.isRefetching || preview.isRefetching;
  const refresh = () => {
    void shift.refetch();
    void history.refetch();
    void preview.refetch();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.brandPrimary}
          />
        }
      >
        <Text style={styles.title}>Plantões</Text>
        <View style={styles.tabs}>
          <Chip
            label="Turno atual"
            selected={tab === 'current'}
            onPress={() => setTab('current')}
          />
          <Chip
            label="Histórico"
            count={history.data?.length}
            selected={tab === 'history'}
            onPress={() => setTab('history')}
          />
        </View>
        {tab === 'history' ? (
          <History />
        ) : shift.isPending ? (
          <Skeleton height={120} />
        ) : shift.isError ? (
          <ErrorState message={shift.error.message} onRetry={() => void shift.refetch()} />
        ) : shift.data ? (
          <CurrentShift key={shift.data.id} shift={shift.data} />
        ) : (
          <NoShift />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.display, color: colors.text },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  auto: { fontFamily: fonts.mono, fontSize: 11, color: colors.dim },
  pending: { gap: spacing.sm, borderColor: colors.warn },
  pendingTitle: { ...typography.title, color: colors.text },
  meta: { ...typography.meta, color: colors.muted },
  histCard: { gap: spacing.xs + 2 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  histTitle: { ...typography.title, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
});
