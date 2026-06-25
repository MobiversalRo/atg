'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { dossierSchema, type DossierInput, type Dossier } from '@/lib/dossiers/schema';

export async function listDossiers(): Promise<{ data: Dossier[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dossiers')
    .select('*')
    .is('archived_at', null)
    .order('dossier_number');
  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function getDossier(id: string) {
  const supabase = await createClient();
  const [{ data: dossier }, { data: parcels }, { data: documents }] = await Promise.all([
    supabase.from('dossiers').select('*').eq('id', id).single(),
    supabase.from('parcels').select('*').eq('dossier_id', id).is('archived_at', null),
    supabase.from('documents').select('*').eq('dossier_id', id).is('archived_at', null),
  ]);
  return { dossier, parcels: parcels ?? [], documents: documents ?? [] };
}

export async function createDossier(input: DossierInput): Promise<{ error?: string }> {
  const parsed = dossierSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('dossiers').insert(parsed.data).select('id').single();
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: data.id, action: 'create' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}

export async function updateDossier(id: string, input: DossierInput): Promise<{ error?: string }> {
  const parsed = dossierSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('dossiers').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: id, action: 'update' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}

export async function archiveDossier(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('dossiers')
    .update({ archived_at: new Date().toISOString(), archived_by: auth.user?.id ?? null })
    .eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: id, action: 'archive' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}

export async function listArchivedDossiers(): Promise<{ data: Dossier[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dossiers')
    .select('*')
    .not('archived_at', 'is', null)
    .order('dossier_number');
  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function unarchiveDossier(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('dossiers')
    .update({ archived_at: null, archived_by: null })
    .eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: id, action: 'restore' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}
