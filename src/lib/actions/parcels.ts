'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parcelSchema, type Parcel, type ParcelInput } from '@/lib/farm/schema';

export type ParcelRow = Parcel & { crop_name: string | null; crop_name_en: string | null };
export type HistoryRow = { id: string; season_year: number; crop_name: string };

export async function listParcels(): Promise<{ data: ParcelRow[]; error?: string }> {
  const supabase = await createClient();
  const [{ data: parcels, error }, { data: crops }] = await Promise.all([
    supabase.from('parcels').select('*').is('archived_at', null).order('topo_code'),
    supabase.from('crops').select('id, name, name_en'),
  ]);
  if (error) return { data: [], error: error.message };
  const cropMap = new Map((crops ?? []).map((c) => [c.id, c]));
  const rows = (parcels ?? []).map((p) => {
    const c = p.current_crop_id ? cropMap.get(p.current_crop_id) : null;
    return { ...p, crop_name: c?.name ?? null, crop_name_en: c?.name_en ?? null };
  });
  return { data: rows };
}

export async function createParcel(input: ParcelInput): Promise<{ error?: string }> {
  const parsed = parcelSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('parcels').insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}

export async function updateParcel(id: string, input: ParcelInput): Promise<{ error?: string }> {
  const parsed = parcelSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('parcels').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}

export async function archiveParcel(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('parcels')
    .update({ archived_at: new Date().toISOString(), archived_by: auth.user?.id ?? null })
    .eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'parcel', entity_id: id, action: 'archive' });
  revalidatePath('/[locale]/farm', 'page');
  return {};
}

export async function listParcelHistory(parcelId: string): Promise<HistoryRow[]> {
  const supabase = await createClient();
  const [{ data: hist }, { data: crops }] = await Promise.all([
    supabase
      .from('parcel_crop_history')
      .select('*')
      .eq('parcel_id', parcelId)
      .order('season_year', { ascending: false }),
    supabase.from('crops').select('id, name'),
  ]);
  const cropMap = new Map((crops ?? []).map((c) => [c.id, c.name]));
  return (hist ?? []).map((h) => ({
    id: h.id,
    season_year: h.season_year,
    crop_name: cropMap.get(h.crop_id) ?? '',
  }));
}

export async function addParcelHistory(
  parcelId: string,
  cropId: string,
  seasonYear: number,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('parcel_crop_history')
    .insert({ parcel_id: parcelId, crop_id: cropId, season_year: seasonYear });
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}
