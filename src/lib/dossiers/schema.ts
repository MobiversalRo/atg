import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';
export type Dossier = Database['public']['Tables']['dossiers']['Row'];
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
export const INTABULARE_STATUSES = ['intabulat', 'intabulat_cu_posesie', 'posesie'] as const;

export const dossierSchema = z.object({
  dossier_number: z.string().min(1, 'Dossier number is required'),
  acquisition_date: z.preprocess(emptyToNull, z.string().nullable()),
  original_holder: z.preprocess(emptyToNull, z.string().nullable()),
  intabulare_status: z.preprocess(emptyToNull, z.enum(INTABULARE_STATUSES).nullable()),
});
export type DossierInput = z.infer<typeof dossierSchema>;
