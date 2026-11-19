import { supabase } from '@/lib/supabase';

/** "Assumir": the current user becomes responsible for the follow-up. */
export async function assignFollowUpToMe(followUpId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('follow_ups')
    .update({ assigned_to: userId, assigned_at: new Date().toISOString(), status: 'em_andamento' })
    .eq('id', followUpId);
  if (error) throw new Error(`Não foi possível assumir a pendência: ${error.message}`);
}
