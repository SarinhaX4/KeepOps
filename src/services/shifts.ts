import { supabase } from '@/lib/supabase';
import type { Json, Tables } from '@/types/database';
import type { ShiftKind } from '@/utils/shiftKind';

export type Shift = Tables<'shifts'>;

export async function getOpenShift(userId: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'aberto')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Erro ao carregar turno: ${error.message}`);
  return data;
}

export async function startShift(userId: string, teamId: string, kind: ShiftKind): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .insert({ user_id: userId, team_id: teamId, kind, started_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(`Não foi possível iniciar o turno: ${error.message}`);
  return data;
}

export type ShiftWithPeople = Shift & { authorName: string | null; receiverName: string | null };

const PEOPLE =
  '*, author:profiles!shifts_user_id_fkey(full_name), receiver:profiles!shifts_received_by_fkey(full_name)';

type ShiftRow = Shift & {
  author: { full_name: string } | null;
  receiver: { full_name: string } | null;
};

const withPeople = ({ author, receiver, ...s }: ShiftRow): ShiftWithPeople => ({
  ...s,
  authorName: author?.full_name ?? null,
  receiverName: receiver?.full_name ?? null,
});

/** Closed and received shifts, newest first (history tab). */
export async function listShiftHistory(): Promise<ShiftWithPeople[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select(PEOPLE)
    .neq('status', 'aberto')
    .order('started_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(`Erro ao carregar histórico: ${error.message}`);
  return data.map(withPeople);
}

export async function getShift(id: string): Promise<ShiftWithPeople> {
  const { data, error } = await supabase.from('shifts').select(PEOPLE).eq('id', id).single();
  if (error) throw new Error(`Turno não encontrado: ${error.message}`);
  return withPeople(data);
}

/** Most recent handover written by someone else and not yet received. */
export async function getPendingHandover(userId: string): Promise<ShiftWithPeople | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select(PEOPLE)
    .eq('status', 'encerrado')
    .neq('user_id', userId)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Erro ao carregar passagens: ${error.message}`);
  return data ? withPeople(data) : null;
}

/** Keeps the notes typed during the shift (draft), so nothing is lost. */
export async function saveShiftDraft(id: string, notes: string, nextSteps: string) {
  const { error } = await supabase
    .from('shifts')
    .update({ notes: notes.trim() || null, next_steps: nextSteps.trim() || null })
    .eq('id', id);
  if (error) throw new Error(`Não foi possível salvar o rascunho: ${error.message}`);
}

export async function closeShift(
  id: string,
  params: { endedAt: string; notes: string; nextSteps: string; snapshot: Json },
) {
  const { error } = await supabase
    .from('shifts')
    .update({
      ended_at: params.endedAt,
      status: 'encerrado',
      notes: params.notes.trim() || null,
      next_steps: params.nextSteps.trim() || null,
      handover_snapshot: params.snapshot,
    })
    .eq('id', id)
    .eq('status', 'aberto');
  if (error) throw new Error(`Não foi possível encerrar o turno: ${error.message}`);
}

export async function receiveShift(id: string, userId: string) {
  const { error } = await supabase
    .from('shifts')
    .update({ status: 'recebido', received_by: userId, received_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'encerrado');
  if (error) throw new Error(`Não foi possível confirmar o recebimento: ${error.message}`);
}
