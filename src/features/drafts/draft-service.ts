import { supabase } from '../auth/supabase-client';
import type { DraftInput } from './draft-validation';

export interface CodeDraft extends DraftInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const columns = 'id,user_id,challenge_id,title,code,created_at,updated_at';
const mapDraft = (row: Record<string, string>): CodeDraft => ({
  id: row.id,
  userId: row.user_id,
  challengeId: row.challenge_id,
  title: row.title,
  code: row.code,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listDrafts(): Promise<CodeDraft[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('code_drafts')
    .select(columns)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, string>[]).map(mapDraft);
}

export async function createDraft(userId: string, input: DraftInput): Promise<CodeDraft> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('code_drafts')
    .insert({
      user_id: userId,
      challenge_id: input.challengeId,
      title: input.title,
      code: input.code,
    })
    .select(columns)
    .single();
  if (error) throw error;
  return mapDraft(data);
}

export async function updateDraft(id: string, input: DraftInput): Promise<CodeDraft> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('code_drafts')
    .update({ challenge_id: input.challengeId, title: input.title, code: input.code })
    .eq('id', id)
    .select(columns)
    .single();
  if (error) throw error;
  return mapDraft(data);
}

export async function deleteDraft(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('code_drafts').delete().eq('id', id);
  if (error) throw error;
}
