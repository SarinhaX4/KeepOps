import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createChange,
  getChange,
  listChanges,
  setChangeStatus,
  updateChange,
  type ChangeStatus,
  type NewChangeInput,
} from '@/services/changes';

import { useProfile } from './useProfile';

export const changesKey = ['changes'] as const;
export const changeKey = (id: string) => ['change', id] as const;

export function useChanges() {
  return useQuery({ queryKey: changesKey, queryFn: listChanges });
}

export function useChange(id: string) {
  return useQuery({ queryKey: changeKey(id), queryFn: () => getChange(id) });
}

/** Invalidate every screen that shows changes (list, detail, home). */
function useInvalidateChanges() {
  const queryClient = useQueryClient();
  return (id?: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: changesKey }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
      id ? queryClient.invalidateQueries({ queryKey: changeKey(id) }) : Promise.resolve(),
    ]);
}

export function useCreateChange() {
  const invalidate = useInvalidateChanges();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: (input: NewChangeInput) => {
      if (!profile) throw new Error('Perfil ainda não carregado. Tente novamente.');
      return createChange(input, profile.id, profile.team_id);
    },
    onSuccess: () => invalidate(),
  });
}

export function useUpdateChange(id: string) {
  const invalidate = useInvalidateChanges();
  return useMutation({
    mutationFn: ({ input, currentAppIds }: { input: NewChangeInput; currentAppIds: string[] }) =>
      updateChange(id, input, currentAppIds),
    onSuccess: () => invalidate(id),
  });
}

export function useSetChangeStatus(id: string) {
  const invalidate = useInvalidateChanges();
  return useMutation({
    mutationFn: ({ status, note }: { status: ChangeStatus; note?: string }) =>
      setChangeStatus(id, status, note),
    onSuccess: () => invalidate(id),
  });
}
