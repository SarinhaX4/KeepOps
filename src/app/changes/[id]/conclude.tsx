import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, CircleX, Sparkles, TriangleExclamationPoint } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useChange, useSetChangeStatus } from '@/hooks/useChanges';
import { useOpenShift } from '@/hooks/useHome';
import { useCreateFollowUp } from '@/hooks/useValidation';
import { toast } from '@/store/toast';
import { colors, fonts, hitTarget, radius, spacing, typography } from '@/theme';
import { conclusionLabel, suggestConclusion, type ConclusionStatus } from '@/utils/conclusion';
import { validationProgress } from '@/utils/home';

const options: {
  value: ConclusionStatus;
  icon: typeof CircleCheck;
  fg: string;
  bg: string;
  border: string;
}[] = [
  { value: 'validada', icon: CircleCheck, fg: colors.okText, bg: colors.okSoft, border: colors.ok },
  {
    value: 'validada_com_ressalvas',
    icon: TriangleExclamationPoint,
    fg: colors.warnText,
    bg: colors.warnSoft,
    border: colors.warn,
  },
  { value: 'reprovada', icon: CircleX, fg: colors.badText, bg: colors.badSoft, border: colors.bad },
];

export default function ConcludeChangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const change = useChange(id);
  const shift = useOpenShift();
  const setStatus = useSetChangeStatus(id);
  const createFollowUp = useCreateFollowUp();
  const [choice, setChoice] = useState<ConclusionStatus | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | undefined>();

  const data = change.data;
  const allResults = data?.apps.flatMap((a) => a.steps.map((s) => s.result)) ?? [];
  const suggestion = suggestConclusion(allResults);
  const selected = choice ?? suggestion.status;
  const overridden = selected !== suggestion.status;

  function offerFollowUp(status: ConclusionStatus) {
    if (!data || status === 'validada') {
      router.back();
      return;
    }
    // Spec: when the result is not "Validada", suggest a pre-filled follow-up for the week team.
    Alert.alert(
      'Criar pendência para a equipe?',
      `"${data.change_number}: ${conclusionLabel[status].toLowerCase()}" ficará aberta até alguém assumir e concluir.`,
      [
        { text: 'Agora não', style: 'cancel', onPress: () => router.back() },
        {
          text: 'Criar pendência',
          onPress: () =>
            createFollowUp.mutate(
              {
                title: `Acompanhar ${data.change_number}: ${data.title}`,
                description: `Concluída como "${conclusionLabel[status]}". ${note.trim()}`.trim(),
                sourceType: 'change',
                sourceId: data.id,
                applicationId: data.apps.length === 1 ? (data.apps[0]?.id ?? null) : null,
                shiftId: shift.data?.id ?? null,
              },
              {
                onSuccess: () => toast('Pendência criada'),
                onError: (e) => Alert.alert('Erro', e.message),
                onSettled: () => router.back(),
              },
            ),
        },
      ],
    );
  }

  function conclude() {
    if (overridden && note.trim().length < 5) {
      setNoteError('Explique por que o resultado difere do sugerido.');
      return;
    }
    setNoteError(undefined);
    Alert.alert(
      `Concluir como "${conclusionLabel[selected]}"?`,
      'A GMUD sai da validação e o resultado fica registrado.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Concluir',
          onPress: () =>
            setStatus.mutate(
              { status: selected, note: note.trim() || undefined },
              {
                onSuccess: () => {
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  toast(`GMUD concluída · ${conclusionLabel[selected]}`);
                  offerFollowUp(selected);
                },
                onError: (e) => Alert.alert('Erro', e.message),
              },
            ),
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen>
        {change.isPending ? (
          <>
            <Skeleton height={120} />
            <Skeleton height={200} />
          </>
        ) : change.isError || !data ? (
          <ErrorState
            message={change.error?.message ?? 'GMUD não encontrada.'}
            onRetry={() => void change.refetch()}
          />
        ) : (
          <>
            <View style={styles.head}>
              <Text style={styles.number}>{data.change_number}</Text>
              <Text style={styles.title}>{data.title}</Text>
            </View>

            <SectionHeader title="Resumo por aplicação" />
            <Card style={styles.summary}>
              {data.apps.map((a) => {
                const p = validationProgress(a.steps.map((s) => s.result));
                return (
                  <View key={a.id} style={styles.summaryRow}>
                    <Text style={styles.appName}>{a.name}</Text>
                    <Text style={styles.mono}>
                      <Text style={{ color: colors.okText }}>{p.approved}✓</Text>
                      {'  '}
                      <Text style={{ color: p.failed ? colors.badText : colors.dim }}>
                        {p.failed}✗
                      </Text>
                      {'  '}
                      <Text style={{ color: colors.dim }}>{p.notApplicable} N/A</Text>
                      {p.pending ? (
                        <Text style={{ color: colors.warnText }}>{`  ${p.pending} pend.`}</Text>
                      ) : null}
                    </Text>
                  </View>
                );
              })}
            </Card>

            <Card style={styles.suggestion}>
              <Sparkles size={16} color={colors.brandPrimaryText} strokeWidth={1.8} />
              <Text style={styles.suggestionText}>
                Sugerido: <Text style={styles.bold}>{conclusionLabel[suggestion.status]}</Text> —{' '}
                {suggestion.reason}
              </Text>
            </Card>

            <SectionHeader title="Resultado" />
            <View style={styles.options}>
              {options.map((o) => {
                const isSel = selected === o.value;
                const Icon = o.icon;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setChoice(o.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSel }}
                    accessibilityLabel={`${conclusionLabel[o.value]}${o.value === suggestion.status ? ', sugerido' : ''}`}
                    style={[
                      styles.option,
                      isSel && { backgroundColor: o.bg, borderColor: o.border },
                    ]}
                  >
                    <Icon size={18} color={isSel ? o.fg : colors.muted} strokeWidth={2} />
                    <Text style={[styles.optionText, { color: isSel ? o.fg : colors.text }]}>
                      {conclusionLabel[o.value]}
                    </Text>
                    {o.value === suggestion.status ? (
                      <Text style={styles.tag}>sugerido</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <TextField
              label={
                overridden ? 'Justificativa (obrigatória)' : 'Observação de conclusão (opcional)'
              }
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Ex.: API voltou após restart do executor; acompanhar fila."
              error={noteError}
            />

            <Button
              label="Concluir GMUD"
              onPress={conclude}
              loading={setStatus.isPending || createFollowUp.isPending}
            />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  head: { gap: spacing.xs },
  number: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.muted },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  summary: { gap: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  appName: { ...typography.bodySmall, color: colors.text, flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 13 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandPrimarySoft,
    borderColor: 'transparent',
  },
  suggestionText: { ...typography.bodySmall, color: colors.text, flex: 1 },
  bold: { fontFamily: fonts.semibold },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: hitTarget + 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionText: { flex: 1, fontFamily: fonts.semibold, fontSize: 15 },
  tag: { fontFamily: fonts.mono, fontSize: 11, color: colors.brandPrimaryText },
});
