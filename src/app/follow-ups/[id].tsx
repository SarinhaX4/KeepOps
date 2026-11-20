import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, UserPlus } from 'lucide-react-native';
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
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useAssignFromList, useConcludeFollowUp, useFollowUps } from '@/hooks/useFollowUps';
import { useProfile } from '@/hooks/useProfile';
import type { FollowUpItem } from '@/services/followUps';
import { toast } from '@/store/toast';
import { colors, fonts, spacing, typography } from '@/theme';
import { formatRelative, formatShortDateTime } from '@/utils/format';
import { shiftKindLabel } from '@/utils/shiftKind';

const sourceLabel: Record<FollowUpItem['sourceType'], string> = {
  change: 'GMUD',
  incident: 'Ocorrência',
  validation: 'Passo reprovado',
  manual: 'Criada manualmente',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function FollowUpDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useFollowUps();
  const assign = useAssignFromList();
  const conclude = useConcludeFollowUp();
  const { data: profile } = useProfile();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();

  const f = list.data?.find((x) => x.id === id);
  const done = f?.status === 'concluida';

  function openSource() {
    if (!f) return;
    if (f.sourceChangeId)
      router.push({ pathname: '/changes/[id]', params: { id: f.sourceChangeId } });
    else if (f.sourceType === 'incident' && f.sourceId)
      router.push({ pathname: '/incidents/[id]', params: { id: f.sourceId } });
  }

  function submitConclude() {
    if (!f) return;
    if (note.trim().length < 3) return setError('A nota é obrigatória: descreva o que foi feito.');
    setError(undefined);
    conclude.mutate(
      { id: f.id, note },
      {
        onSuccess: () => {
          toast('Pendência concluída');
          router.back();
        },
        onError: (e) => Alert.alert('Erro', e.message),
      },
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen>
        {list.isPending ? (
          <Skeleton height={200} />
        ) : list.isError || !f ? (
          <ErrorState
            message={list.error?.message ?? 'Pendência não encontrada.'}
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            <Text style={styles.title}>{f.title}</Text>
            {f.description ? <Text style={styles.body}>{f.description}</Text> : null}

            <Card style={styles.card}>
              <Field
                label="Status"
                value={done ? 'Concluída' : f.assignedTo ? 'Em andamento' : 'Sem responsável'}
              />
              <Field label="Responsável" value={f.assigneeName ?? '—'} />
              {f.appName ? <Field label="Aplicação" value={f.appName} /> : null}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Origem</Text>
                {f.sourceChangeId || (f.sourceType === 'incident' && f.sourceId) ? (
                  <Pressable onPress={openSource} accessibilityRole="link" hitSlop={8}>
                    <Text style={styles.link}>
                      {sourceLabel[f.sourceType]} · {f.sourceLabel} →
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.fieldValue}>{sourceLabel[f.sourceType]}</Text>
                )}
              </View>
              {f.shiftKind && f.shiftStartedAt ? (
                <Field
                  label="Criada no turno"
                  value={`${shiftKindLabel[f.shiftKind]} · ${formatShortDateTime(f.shiftStartedAt)}`}
                />
              ) : null}
              <Field
                label="Criada"
                value={`${formatRelative(f.createdAt)}${f.creatorName ? ` por ${f.creatorName}` : ''}`}
              />
            </Card>

            {done ? (
              <Card style={styles.card}>
                <View style={styles.doneHead}>
                  <CircleCheck size={18} color={colors.okText} strokeWidth={2} />
                  <Text style={styles.doneTitle}>
                    Concluída {f.resolvedAt ? formatShortDateTime(f.resolvedAt) : ''}{' '}
                    {f.resolverName ? `por ${f.resolverName}` : ''}
                  </Text>
                </View>
                {f.resolutionNote ? <Text style={styles.body}>{f.resolutionNote}</Text> : null}
              </Card>
            ) : (
              <>
                {f.assignedTo !== profile?.id ? (
                  <Button
                    label={
                      f.assignedTo
                        ? `Assumir no lugar de ${f.assigneeName?.split(' ')[0] ?? 'outra pessoa'}`
                        : 'Assumir'
                    }
                    icon={UserPlus}
                    variant={f.assignedTo ? 'secondary' : 'primary'}
                    onPress={() =>
                      assign.mutate(f.id, {
                        onSuccess: () => toast('Pendência assumida'),
                        onError: (e) => Alert.alert('Erro', e.message),
                      })
                    }
                    loading={assign.isPending}
                  />
                ) : null}
                <TextField
                  label="Nota de conclusão (obrigatória)"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  error={error}
                  placeholder="Ex.: Fila reprocessada às 9h40, 1.240 mensagens liquidadas."
                />
                <Button
                  label="Concluir pendência"
                  icon={CircleCheck}
                  variant="secondary"
                  onPress={submitConclude}
                  loading={conclude.isPending}
                />
              </>
            )}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  body: { ...typography.bodySmall, color: colors.muted },
  card: { gap: spacing.md },
  field: { gap: 2 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.dim },
  fieldValue: { ...typography.bodySmall, color: colors.text },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.brandPrimaryText },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doneTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.okText, flex: 1 },
});
