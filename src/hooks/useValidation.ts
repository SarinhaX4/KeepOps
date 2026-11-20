import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { createFollowUp, type NewFollowUp } from '@/services/followUps';
import type { ChangeDetail } from '@/services/changes';
import {
  saveHealthCheck,
  setValidationNote,
  setValidationResult,
  type ValidationResult,
} from '@/services/validations';
import type { Enums } from '@/types/database';
import { runHealthCheck } from '@/utils/healthcheck';

import { changeKey } from './useChanges';
import { useProfile } from './useProfile';

function patchStep(
  data: ChangeDetail,
  stepId: string,
  patch: Partial<ChangeDetail['apps'][number]['steps'][number]>,
): ChangeDetail {
  return {
    ...data,
    apps: data.apps.map((a) => ({
      ...a,
      steps: a.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    })),
  };
}

/** Marks a checklist step with an instant (optimistic) response + light haptic. */
export function useSetStepResult(changeId: string) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const key = changeKey(changeId);

  return useMutation({
    mutationFn: ({ stepId, result }: { stepId: string; result: ValidationResult }) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return setValidationResult(stepId, result, profile.id);
    },
    onMutate: async ({ stepId, result }) => {
      void Haptics.impactAsync(
        result === 'reprovado'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChangeDetail>(key);
      if (previous) {
        const pending = result === 'pendente';
        queryClient.setQueryData(
          key,
          patchStep(previous, stepId, {
            result,
            by: pending ? null : (profile?.full_name ?? null),
            performed_by: pending ? null : (profile?.id ?? null),
            performed_at: pending ? null : new Date().toISOString(),
          }),
        );
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useSetStepNote(changeId: string) {
  const queryClient = useQueryClient();
  const key = changeKey(changeId);
  return useMutation({
    mutationFn: ({ stepId, note }: { stepId: string; note: string }) =>
      setValidationNote(stepId, note),
    onMutate: ({ stepId, note }) => {
      const previous = queryClient.getQueryData<ChangeDetail>(key);
      if (previous)
        queryClient.setQueryData(key, patchStep(previous, stepId, { note: note.trim() || null }));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
  });
}

/** Runs a real HTTP check from the phone and stores status + latency. */
export function useRunHealthCheck(changeId: string) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async ({
      applicationId,
      url,
      phase,
    }: {
      applicationId: string;
      url: string;
      phase: Enums<'health_phase'>;
    }) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      const result = await runHealthCheck(url);
      await saveHealthCheck({ applicationId, changeId, phase, result, userId: profile.id });
      return result;
    },
    onSuccess: (result) => {
      void Haptics.notificationAsync(
        result.ok
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: changeKey(changeId) });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (f: Omit<NewFollowUp, 'teamId' | 'userId'>) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return createFollowUp({ ...f, teamId: profile.team_id, userId: profile.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      void queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      void queryClient.invalidateQueries({ queryKey: ['change'] });
    },
  });
}
