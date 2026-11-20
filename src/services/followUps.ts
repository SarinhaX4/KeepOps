import { supabase } from '@/lib/supabase';

/** "Assumir": the current user becomes responsible for the follow-up. */
export async function assignFollowUpToMe(followUpId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('follow_ups')
    .update({ assigned_to: userId, assigned_at: new Date().toISOString(), status: 'em_andamento' })
    .eq('id', followUpId);
  if (error) throw new Error(`Não foi possível assumir a pendência: ${error.message}`);
}

export type NewFollowUp = {
  teamId: string;
  userId: string;
  title: string;
  description: string | null;
  sourceType: 'change' | 'incident' | 'validation' | 'manual';
  sourceId: string | null;
  applicationId: string | null;
  shiftId: string | null;
};

export async function createFollowUp(f: NewFollowUp): Promise<void> {
  const { error } = await supabase.from('follow_ups').insert({
    team_id: f.teamId,
    title: f.title,
    description: f.description,
    source_type: f.sourceType,
    source_id: f.sourceId,
    application_id: f.applicationId,
    created_in_shift_id: f.shiftId,
    created_by: f.userId,
  });
  if (error) throw new Error(`Não foi possível criar a pendência: ${error.message}`);
}
