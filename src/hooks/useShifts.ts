import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { loadCurrentHandover } from '@/services/handover';
import {
  closeShift,
  getPendingHandover,
  getShift,
  listShiftHistory,
  receiveShift,
  saveShiftDraft,
} from '@/services/shifts';
import type { Json } from '@/types/database';

import { useProfile } from './useProfile';

export function useShiftHistory() {
  return useQuery({ queryKey: ['shifts', 'history'], queryFn: listShiftHistory });
}

export function useShift(id: string) {
  return useQuery({ queryKey: ['shifts', 'detail', id], queryFn: () => getShift(id) });
}

export function usePendingHandover() {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['shifts', 'pending', profile?.id],
    queryFn: () => getPendingHandover(profile?.id as string),
    enabled: Boolean(profile),
  });
}

/** Live preview of the current shift's handover (notes are merged on screen). */
export function useCurrentHandover() {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ['handover', 'current', profile?.id],
    queryFn: () =>
      loadCurrentHandover({
        userId: profile?.id as string,
        authorName: profile?.full_name as string,
        notes: '',
        nextSteps: '',
      }),
    enabled: Boolean(profile),
  });
}

function useInvalidateShifts() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['shifts'] }),
      qc.invalidateQueries({ queryKey: ['shift'] }),
      qc.invalidateQueries({ queryKey: ['handover'] }),
      qc.invalidateQueries({ queryKey: ['home'] }),
    ]);
}

export function useSaveShiftDraft() {
  return useMutation({
    mutationFn: ({ id, notes, nextSteps }: { id: string; notes: string; nextSteps: string }) =>
      saveShiftDraft(id, notes, nextSteps),
  });
}

/** Builds the final snapshot with fresh data, then closes the shift. */
export function useCloseShift() {
  const invalidate = useInvalidateShifts();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: async ({ notes, nextSteps }: { notes: string; nextSteps: string }) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      const endedAt = new Date();
      const handover = await loadCurrentHandover({
        userId: profile.id,
        authorName: profile.full_name,
        notes,
        nextSteps,
        endedAt,
      });
      if (!handover) throw new Error('Nenhum turno aberto para encerrar.');
      await closeShift(handover.shift.id, {
        endedAt: endedAt.toISOString(),
        notes,
        nextSteps,
        snapshot: handover as unknown as Json,
      });
      return handover;
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return invalidate();
    },
  });
}

export function useReceiveShift() {
  const invalidate = useInvalidateShifts();
  const { data: profile } = useProfile();
  return useMutation({
    mutationFn: (id: string) => {
      if (!profile) throw new Error('Perfil ainda não carregado.');
      return receiveShift(id, profile.id);
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return invalidate();
    },
  });
}
