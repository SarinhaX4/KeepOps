import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
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
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useApplications } from '@/hooks/useApplications';
import { useOpenShift } from '@/hooks/useHome';
import { useCreateFollowUp } from '@/hooks/useValidation';
import { toast } from '@/store/toast';
import { colors, fonts, hitTarget, radius, spacing } from '@/theme';

export default function NewFollowUpScreen() {
  const apps = useApplications();
  const shift = useOpenShift();
  const create = useCreateFollowUp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appId, setAppId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  function submit() {
    if (title.trim().length < 5)
      return setError('Descreva a pendência em pelo menos 5 caracteres.');
    setError(undefined);
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        sourceType: 'manual',
        sourceId: null,
        applicationId: appId,
        shiftId: shift.data?.id ?? null,
      },
      {
        onSuccess: () => {
          toast('Pendência criada');
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
        <TextField
          label="O que precisa ser feito?"
          value={title}
          onChangeText={setTitle}
          error={error}
          placeholder="Ex.: Reprocessar fila do barramento"
        />
        <TextField
          label="Contexto (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <SectionHeader title="Aplicação (opcional)" />
        {apps.isPending ? (
          <Skeleton height={hitTarget} />
        ) : (
          <View style={styles.chips}>
            {(apps.data ?? []).map((a) => {
              const sel = appId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setAppId(sel ? null : a.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  {sel ? (
                    <Check size={14} color={colors.brandPrimaryText} strokeWidth={2.4} />
                  ) : null}
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>{a.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {shift.data ? <Text style={styles.hint}>Será registrada no seu turno atual.</Text> : null}
        <Button label="Criar pendência" onPress={submit} loading={create.isPending} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: hitTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSel: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimarySoft },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  chipTextSel: { color: colors.brandPrimaryText },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim },
});
