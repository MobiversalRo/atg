'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { documentMetaSchema } from '@/lib/documents/schema';

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
