import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import {
  assignFollowUpToMe,
  concludeFollowUp,
  listFollowUps,
  type FollowUpItem,
} from '@/services/followUps';

import { useProfile } from './useProfile';

export const followUpsKey = ['follow-ups'] as const;

export function useFollowUps() {
  return useQuery({
    queryKey: followUpsKey,
    queryFn: () => listFollowUps({ includeDone: true }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: followUpsKey }),
      qc.invalidateQueries({ queryKey: ['home'] }),
    ]);
}

/** "Assumir" from the Pendências tab, with optimistic update. */
export function useAssignFromList() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (id: string) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return assignFollowUpToMe(id, profile.id);
    },
    onMutate: async (id) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await qc.cancelQueries({ queryKey: followUpsKey });
      const previous = qc.getQueryData<FollowUpItem[]>(followUpsKey);
      if (previous && profile) {
        qc.setQueryData<FollowUpItem[]>(
          followUpsKey,
          previous.map((f) =>
            f.id === id
              ? {
                  ...f,
                  assignedTo: profile.id,
                  assigneeName: profile.full_name,
                  assignedAt: new Date().toISOString(),
                  status: 'em_andamento',
                }
              : f,
          ),
        );
      }
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(followUpsKey, ctx.previous);
    },
    onSettled: () => invalidate(),
  });
}

export function useConcludeFollowUp() {
  const invalidate = useInvalidate();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return concludeFollowUp(id, note, profile.id);
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return invalidate();
    },
  });
}
