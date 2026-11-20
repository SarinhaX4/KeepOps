import { create } from 'zustand';

type ToastTone = 'success' | 'error' | 'info';

type ToastState = {
  message: string | null;
  tone: ToastTone;
  /** Increments on every show, so the same message can re-trigger. */
  key: number;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  key: 0,
  show: (message, tone = 'success') => set((s) => ({ message, tone, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

/** Shortcut usable outside React components. */
export const toast = (message: string, tone?: ToastTone) =>
  useToastStore.getState().show(message, tone);
