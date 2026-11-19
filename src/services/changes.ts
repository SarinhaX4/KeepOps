import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type ChangeStatus = Enums<'change_status'>;

export type ChangeListItem = Tables<'changes'> & {
  apps: Pick<Tables<'applications'>, 'id' | 'short_name'>[];
};

export type NewChangeInput = {
  changeNumber: string;
  title: string;
  description: string | null;
  windowStart: Date;
  windowEnd: Date;
  executorTeam: string | null;
  executorContact: string | null;
  applicationIds: string[];
};

export async function listChanges(): Promise<ChangeListItem[]> {
  const { data, error } = await supabase
    .from('changes')
    .select('*, change_applications(applications(id, short_name))')
    .order('window_start', { ascending: false });
  if (error) throw new Error(`Erro ao carregar GMUDs: ${error.message}`);

  return data.map(({ change_applications, ...change }) => ({
    ...change,
    apps: change_applications
      .map((ca) => ca.applications)
      .filter((a): a is NonNullable<typeof a> => a !== null),
  }));
}

/**
 * Creates the change and links its applications.
 * The database trigger then copies each application's validation script into `validations`.
 */
export async function createChange(input: NewChangeInput, userId: string, teamId: string) {
  const { data: change, error } = await supabase
    .from('changes')
    .insert({
      team_id: teamId,
      change_number: input.changeNumber,
      title: input.title,
      description: input.description,
      window_start: input.windowStart.toISOString(),
      window_end: input.windowEnd.toISOString(),
      executor_team: input.executorTeam,
      executor_contact: input.executorContact,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      throw new Error(`Já existe uma GMUD com o número ${input.changeNumber}.`);
    throw new Error(`Erro ao criar GMUD: ${error.message}`);
  }

  const { error: linkError } = await supabase.from('change_applications').insert(
    input.applicationIds.map((applicationId) => ({
      change_id: change.id,
      application_id: applicationId,
    })),
  );
  if (linkError)
    throw new Error(`GMUD criada, mas falhou ao vincular aplicações: ${linkError.message}`);

  return change;
}
