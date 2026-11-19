import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Application = Tables<'applications'>;

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase.from('applications').select('*').order('name');
  if (error) throw new Error(`Erro ao carregar aplicações: ${error.message}`);
  return data;
}
