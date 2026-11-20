import { ListPlus, Siren } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ChangeDetail } from '@/services/changes';
import type { ValidationResult } from '@/services/validations';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatTime } from '@/utils/format';

import { SegmentedResult } from './SegmentedResult';

type Step = ChangeDetail['apps'][number]['steps'][number];

type Props = {
  step: Step;
  index: number;
  editable: boolean;
  onResult: (result: ValidationResult) => void;
  onNote: (note: string) => void;
  onCreateFollowUp: () => void;
  onOpenIncident: () => void;
};

export function ValidationStepRow({
  step,
  index,
  editable,
  onResult,
  onNote,
  onCreateFollowUp,
  onOpenIncident,
}: Props) {
  const [note, setNote] = useState(step.note ?? '');
  const needsDetail = step.result === 'reprovado' || step.result === 'na';

  return (
    <Card style={[styles.card, step.result === 'reprovado' && styles.failed]}>
      <View style={styles.titleRow}>
        <Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={styles.title}>{step.step_title}</Text>
      </View>

      <SegmentedResult value={step.result} onChange={onResult} disabled={!editable} />

      {step.performed_at ? (
        <Text style={styles.author}>
          {step.by ?? 'Alguém da equipe'} · {formatTime(step.performed_at)}
        </Text>
      ) : null}

      {needsDetail ? (
        <View style={styles.detail}>
          <TextInput
            value={note}
            onChangeText={setNote}
            onBlur={() => {
              if (note.trim() !== (step.note ?? '')) onNote(note);
            }}
            editable={editable}
            multiline
            placeholder={
              step.result === 'reprovado'
                ? 'O que falhou? (ex.: HTTP 503 após restart)'
                : 'Por que não se aplica?'
            }
            placeholderTextColor={colors.dim}
            selectionColor={colors.brandPrimary}
            accessibilityLabel="Observação do passo"
            style={styles.note}
          />
          {editable ? (
            <View style={styles.actions}>
              {step.result === 'reprovado' ? (
                <View style={styles.flex}>
                  <Button
                    label="Abrir ocorrência"
                    icon={Siren}
                    variant="danger"
                    onPress={onOpenIncident}
                  />
                </View>
              ) : null}
              <View style={styles.flex}>
                <Button
                  label="Criar pendência"
                  icon={ListPlus}
                  variant="secondary"
                  onPress={onCreateFollowUp}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  failed: { borderColor: colors.bad },
  titleRow: { flexDirection: 'row', gap: spacing.sm },
  index: { fontFamily: fonts.mono, fontSize: 13, color: colors.dim, marginTop: 1 },
  title: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  author: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  detail: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  note: {
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    backgroundColor: colors.bg,
    padding: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});
