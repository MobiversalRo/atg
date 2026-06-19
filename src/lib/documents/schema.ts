import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';
export type Document = Database['public']['Tables']['documents']['Row'];
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
export const DOCUMENT_VARIANTS = ['original', 'copie', 'timbrat', 'legalizat'] as const;

// Metadata accompanying an uploaded file (the file itself is handled separately).
export const documentMetaSchema = z.object({
  dossier_id: z.preprocess(emptyToNull, z.string().nullable()),
  parcel_id: z.preprocess(emptyToNull, z.string().nullable()),
  document_type_id: z.preprocess(emptyToNull, z.string().nullable()),
  variant: z.preprocess(emptyToNull, z.enum(DOCUMENT_VARIANTS).nullable()),
  document_number: z.preprocess(emptyToNull, z.string().nullable()),
  document_date: z.preprocess(emptyToNull, z.string().nullable()),
});
export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;
