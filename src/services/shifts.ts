import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
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
