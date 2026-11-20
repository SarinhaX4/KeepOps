import { router, useLocalSearchParams } from 'expo-router';
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

import { severityHint, severityTone } from '@/components/domain/IncidentBadges';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { useApplications } from '@/hooks/useApplications';
import { useCreateIncident } from '@/hooks/useIncidents';
import type { Severity } from '@/services/incidents';
import { toast } from '@/store/toast';
import { colors, fonts, hitTarget, radius, spacing } from '@/theme';

const severities: Severity[] = ['sev1', 'sev2', 'sev3', 'sev4'];

type Params = {
  changeId?: string;
  appId?: string;
  validationId?: string;
  title?: string;
  note?: string;
  changeNumber?: string;
};

export default function NewIncidentScreen() {
  const p = useLocalSearchParams<Params>();
  const apps = useApplications();
  const create = useCreateIncident();

  // Pre-filled when opened from a failed validation step.
  const [title, setTitle] = useState(p.title ?? '');
  const [severity, setSeverity] = useState<Severity>(p.validationId ? 'sev2' : 'sev3');
  const [appId, setAppId] = useState<string | null>(p.appId ?? null);
  const [ticket, setTicket] = useState('');
  const [description, setDescription] = useState(p.note ?? '');
  const [errors, setErrors] = useState<{ title?: string; ticket?: string }>({});

  function submit() {
    const next: typeof errors = {};
    if (title.trim().length < 5) next.title = 'Descreva a falha em pelo menos 5 caracteres.';
    if (ticket.trim() && !/^INC\d{7}$/i.test(ticket.trim()))
      next.ticket = 'Use INC seguido de 7 dígitos (ex.: INC0012346).';
    setErrors(next);
    if (Object.keys(next).length) return;

    create.mutate(
      {
        title: title.trim(),
        severity,
        applicationId: appId,
        changeId: p.changeId ?? null,
        validationId: p.validationId ?? null,
        externalTicket: ticket.trim() ? ticket.trim().toUpperCase() : null,
        description: description.trim() || null,
      },
      {
        onSuccess: (id) => {
          toast('Ocorrência aberta');
          router.replace({ pathname: '/incidents/[id]', params: { id } });
        },
        onError: (e) => Alert.alert('Não foi possível abrir', e.message),
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
        {p.changeNumber ? (
          <Text style={styles.origin}>
            Vinculada à {p.changeNumber} · aberta a partir de passo reprovado
          </Text>
        ) : null}
        <TextField
          label="O que aconteceu?"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          placeholder="Ex.: API de Pagamentos retornando 503"
        />

        <SectionHeader title="Severidade" />
        <View style={styles.sevRow}>
          {severities.map((s) => {
            const t = severityTone[s];
            const sel = severity === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSeverity(s)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${t.label}: ${severityHint[s]}`}
                style={[styles.sev, sel && { backgroundColor: t.bg, borderColor: t.fg }]}
              >
                <Text style={[styles.sevLabel, { color: sel ? t.fg : colors.muted }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>{severityHint[severity]}</Text>

        <SectionHeader title="Aplicação" />
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

        <TextField
          label="Número do INC no ITSM (opcional)"
          value={ticket}
          onChangeText={setTicket}
          autoCapitalize="characters"
          mono
          placeholder="INC0012346"
          error={errors.ticket}
          hint="Só referência em texto — o KeepOps não integra com o ITSM."
        />
        <TextField
          label="Detalhes (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button label="Abrir ocorrência" onPress={submit} loading={create.isPending} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  origin: { fontFamily: fonts.mono, fontSize: 12, color: colors.infoText },
  sevRow: { flexDirection: 'row', gap: spacing.sm },
  sev: {
    flex: 1,
    minHeight: hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sevLabel: { fontFamily: fonts.monoSemibold, fontSize: 14 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.dim, marginTop: -spacing.sm },
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
});
