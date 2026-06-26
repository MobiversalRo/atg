'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { documentEditSchema, documentMetaSchema } from '@/lib/documents/schema';

/** Upload one scanned file and attach it to a dossier/parcel. The original is immutable (CF-4). */
export async function uploadDocument(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file' };

  const meta = documentMetaSchema.safeParse({
    dossier_id: formData.get('dossier_id'),
    parcel_id: formData.get('parcel_id'),
    document_type_id: formData.get('document_type_id'),
    variant: formData.get('variant'),
    document_number: formData.get('document_number'),
    document_date: formData.get('document_date'),
  });
  if (!meta.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${meta.data.dossier_id ?? 'unfiled'}/${Date.now()}_${safeName}`;
  const { error: upErr } = await supabase.storage.from('documents').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (upErr) return { error: upErr.message };

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      ...meta.data,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type || null,
      uploaded_by: auth.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };

  await supabase.from('audit_log').insert({ entity: 'document', entity_id: doc.id, action: 'create' });
  if (meta.data.dossier_id) revalidatePath(`/[locale]/dossiers/[id]`, 'page');
  return {};
}

/** A short-lived signed URL to view/download the original scan. */
export async function getDocumentUrl(storagePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60 * 10);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

/** Document-type nomenclator options for the upload form / list labels. */
export async function listDocumentTypes(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('document_types').select('id, name').order('sort_order');
  return data ?? [];
}

/** Update a document's metadata (not the file — that's immutable, CF-4). */
export async function updateDocument(
  id: string,
  input: { document_type_id: string | null; variant: string | null; document_number: string | null; document_date: string | null },
): Promise<{ error?: string }> {
  const parsed = documentEditSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('documents').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'document', entity_id: id, action: 'update' });
  revalidatePath('/[locale]/dossiers/[id]', 'page');
  return {};
}

/** Create a document type on the fly (Req 6). Reuses an existing one with the same name. */
export async function createDocumentType(name: string): Promise<{ id?: string; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('document_types')
    .select('id')
    .ilike('name', trimmed)
    .limit(1)
    .maybeSingle();
  if (existing) return { id: existing.id as string };
  const slug =
    trimmed.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tip';
  const code = `${slug}_${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from('document_types')
    .insert({ code, name: trimmed, name_en: trimmed, sort_order: 999 })
    .select('id')
    .single();
  if (error) return { error: error.message };
  revalidatePath('/[locale]/dossiers/[id]', 'page');
  return { id: data.id };
}
