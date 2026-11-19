import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assignFollowUpToMe } from '@/services/followUps';
import { getHomeData, type HomeData } from '@/services/home';
import { startShift } from '@/services/shifts';
import { useSessionStore } from '@/store/session';
import type { ShiftKind } from '@/utils/shiftKind';

import { useProfile } from './useProfile';

export const homeKey = (userId: string | undefined) => ['home', userId] as const;

export function useHome() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: homeKey(userId),
    queryFn: () => getHomeData(userId as string),
    enabled: Boolean(userId),
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (kind: ShiftKind) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return startShift(profile.id, profile.team_id, kind);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['home'] }),
  });
}

/** "Assumir" with optimistic update: the row flips to "Com você" instantly. */
export function useAssignFollowUp() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const key = homeKey(profile?.id);

  return useMutation({
    mutationFn: (followUpId: string) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return assignFollowUpToMe(followUpId, profile.id);
    },
    onMutate: async (followUpId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HomeData>(key);
      if (previous && profile) {
        queryClient.setQueryData<HomeData>(key, {
          ...previous,
          followUps: previous.followUps.map((f) =>
            f.id === followUpId
              ? {
                  ...f,
                  assignedTo: profile.id,
                  assigneeName: profile.full_name,
                  status: 'em_andamento',
                }
              : f,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['home'] }),
  });
}
