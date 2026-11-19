import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createChange, listChanges, type NewChangeInput } from '@/services/changes';

import { useProfile } from './useProfile';

export const changesKey = ['changes'] as const;

export function useChanges() {
  return useQuery({ queryKey: changesKey, queryFn: listChanges });
}

export function useCreateChange() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: (input: NewChangeInput) => {
      if (!profile) throw new Error('Perfil ainda não carregado. Tente novamente.');
      return createChange(input, profile.id, profile.team_id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: changesKey }),
  });
}
