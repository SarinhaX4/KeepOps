import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useApplications } from '@/hooks/useApplications';
import { useCreateChange } from '@/hooks/useChanges';
import { colors, fonts, hitTarget, radius, spacing, typography } from '@/theme';
import { changeFormSchema, type ChangeFormValues } from '@/utils/changeForm';
import { parseSpInput, toSpInput } from '@/utils/format';
import { zodResolver } from '@/utils/zodResolver';

/** Default window: tonight 22:00 → 02:00 (São Paulo). */
function defaultWindow() {
  const start = parseSpInput(`${toSpInput(new Date()).slice(0, 10)} 22:00`) ?? new Date();
  const end = new Date(start.getTime() + 4 * 3_600_000);
  return { windowStart: toSpInput(start), windowEnd: toSpInput(end) };
}

export default function NewChangeScreen() {
  const apps = useApplications();
  const createChange = useCreateChange();

  const { control, handleSubmit, formState } = useForm<ChangeFormValues>({
    resolver: zodResolver(changeFormSchema),
    defaultValues: {
      changeNumber: '',
      title: '',
      description: '',
      executorTeam: '',
      executorContact: '',
      applicationIds: [],
      ...defaultWindow(),
    },
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(async (v) => {
    const windowStart = parseSpInput(v.windowStart);
    const windowEnd = parseSpInput(v.windowEnd);
    if (!windowStart || !windowEnd) return;
    try {
      await createChange.mutateAsync({
        changeNumber: v.changeNumber.trim().toUpperCase(),
        title: v.title.trim(),
        description: v.description.trim() || null,
        windowStart,
        windowEnd,
        executorTeam: v.executorTeam.trim() || null,
        executorContact: v.executorContact.trim() || null,
        applicationIds: v.applicationIds,
      });
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Erro inesperado.');
    }
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Controller
            control={control}
            name="changeNumber"
            render={({ field }) => (
              <TextField
                label="Número da GMUD"
                placeholder="CHG0012350"
                autoCapitalize="characters"
                mono
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.changeNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <TextField
                label="Título"
                placeholder="Ex.: Patch de segurança no OHS"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.title?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextField
                label="Descrição curta (opcional)"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Controller
                control={control}
                name="windowStart"
                render={({ field }) => (
                  <TextField
                    label="Início da janela"
                    mono
                    keyboardType="numbers-and-punctuation"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.windowStart?.message}
                  />
                )}
              />
            </View>
            <View style={styles.flex}>
              <Controller
                control={control}
                name="windowEnd"
                render={({ field }) => (
                  <TextField
                    label="Fim da janela"
                    mono
                    keyboardType="numbers-and-punctuation"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.windowEnd?.message}
                  />
                )}
              />
            </View>
          </View>
          <Text style={styles.hint}>Horário de Brasília · formato dd/mm/aaaa hh:mm</Text>

          <Controller
            control={control}
            name="executorTeam"
            render={({ field }) => (
              <TextField
                label="Equipe executora (opcional)"
                placeholder="Ex.: Fornecedor — Middleware"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="executorContact"
            render={({ field }) => (
              <TextField
                label="Contato para acionamento (opcional)"
                placeholder="Ex.: Plantão · telefone ou canal"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Text style={styles.section}>Aplicações afetadas</Text>
          {apps.isPending ? (
            <Skeleton height={hitTarget} />
          ) : apps.isError ? (
            <ErrorState message={apps.error.message} onRetry={() => void apps.refetch()} />
          ) : (
            <Controller
              control={control}
              name="applicationIds"
              render={({ field }) => (
                <View style={styles.chips}>
                  {apps.data.map((app) => {
                    const selected = field.value.includes(app.id);
                    return (
                      <Pressable
                        key={app.id}
                        onPress={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((id) => id !== app.id)
                              : [...field.value, app.id],
                          )
                        }
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={app.name}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        {selected ? (
                          <Check size={14} color={colors.brandPrimaryText} strokeWidth={2.4} />
                        ) : null}
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {app.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          )}
          {errors.applicationIds?.message ? (
            <Text style={styles.error}>{errors.applicationIds.message}</Text>
          ) : (
            <Text style={styles.hint}>
              O checklist de validação de cada aplicação é criado automaticamente.
            </Text>
          )}

          <Button
            label="Salvar GMUD"
            onPress={() => void onSubmit()}
            loading={createChange.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', gap: spacing.md },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim, marginTop: -spacing.sm },
  section: { ...typography.section, color: colors.muted, marginTop: spacing.sm },
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
  chipSelected: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimarySoft },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  chipTextSelected: { color: colors.brandPrimaryText },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.badText, marginTop: -spacing.sm },
});
