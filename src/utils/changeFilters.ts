import type { Enums } from '@/types/database';

type ChangeStatus = Enums<'change_status'>;

export type ChangeFilterKey =
  'all' | 'scheduled' | 'waiting' | 'validating' | 'validated' | 'caveats' | 'failed' | 'cancelled';

export const changeFilters: { key: ChangeFilterKey; label: string; statuses: ChangeStatus[] }[] = [
  { key: 'all', label: 'Todas', statuses: [] },
  { key: 'scheduled', label: 'Agendadas', statuses: ['agendada'] },
  { key: 'waiting', label: 'Aguardando', statuses: ['aguardando_liberacao'] },
  { key: 'validating', label: 'Em validação', statuses: ['em_validacao'] },
  { key: 'validated', label: 'Validadas', statuses: ['validada'] },
  { key: 'caveats', label: 'Com ressalvas', statuses: ['validada_com_ressalvas'] },
  { key: 'failed', label: 'Reprovadas', statuses: ['reprovada'] },
  { key: 'cancelled', label: 'Canceladas', statuses: ['cancelada'] },
];

type Filterable = { status: ChangeStatus; change_number: string; title: string };

/** Status set + free-text search on number or title (accent/case insensitive). */
export function filterChanges<T extends Filterable>(
  items: T[],
  statuses: ChangeStatus[],
  query: string,
): T[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(query.trim());
  return items.filter(
    (c) =>
      (statuses.length === 0 || statuses.includes(c.status)) &&
      (q === '' || norm(c.change_number).includes(q) || norm(c.title).includes(q)),
  );
}
