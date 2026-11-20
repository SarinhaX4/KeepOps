import type { Enums } from '@/types/database';

type ChangeStatus = Enums<'change_status'>;

export type ChangeAction = {
  /** Button label (pt-BR). */
  label: string;
  to: ChangeStatus;
  /** Ask before applying (irreversible). */
  confirm?: { title: string; message: string };
};

export const FINAL_STATUSES: readonly ChangeStatus[] = [
  'validada',
  'validada_com_ressalvas',
  'reprovada',
  'cancelada',
];

/** Main contextual action per status (spec: "Liberada para validação", "Iniciar validação"...). */
export function primaryAction(status: ChangeStatus): ChangeAction | null {
  switch (status) {
    case 'agendada':
      return { label: 'Executor iniciou a janela', to: 'aguardando_liberacao' };
    case 'aguardando_liberacao':
      return { label: 'Liberada para validação', to: 'em_validacao' };
    default:
      return null;
  }
}

/** Cancelling is allowed only before validation starts. */
export function canCancel(status: ChangeStatus): boolean {
  return status === 'agendada' || status === 'aguardando_liberacao';
}

export function canEdit(status: ChangeStatus): boolean {
  return !FINAL_STATUSES.includes(status);
}

export const cancelAction: ChangeAction = {
  label: 'Cancelar GMUD',
  to: 'cancelada',
  confirm: {
    title: 'Cancelar esta GMUD?',
    message: 'O checklist deixa de valer e a GMUD sai da janela. Essa ação não pode ser desfeita.',
  },
};
