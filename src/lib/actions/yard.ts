'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  truckSchema,
  weightsSchema,
  type TruckInput,
  type WeightsInput,
  type YardStatus,
  type YardTruck,
} from '@/lib/yard/schema';

export type TruckRow = YardTruck & { crop_name: string | null };

export async function listTrucks(): Promise<{ data: TruckRow[]; error?: string }> {
  const supabase = await createClient();
  const [{ data: trucks, error }, { data: crops }] = await Promise.all([
    supabase.from('yard_trucks').select('*').order('created_at'),
    supabase.from('crops').select('id, name'),
  ]);
  if (error) return { data: [], error: error.message };
  const cropMap = new Map((crops ?? []).map((c) => [c.id, c.name]));
  const rows = (trucks ?? []).map((t) => ({
    ...t,
    crop_name: t.cargo_crop_id ? (cropMap.get(t.cargo_crop_id) ?? null) : null,
  }));
  return { data: rows };
}

export async function createTruck(input: TruckInput): Promise<{ error?: string }> {
  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('yard_trucks')
    .insert({ ...parsed.data, status: 'gate' });
  if (error) return { error: error.message };
  revalidatePath('/[locale]/yard', 'page');
  return {};
}

export async function updateTruckStatus(
  id: string,
  status: YardStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('yard_trucks')
    .update({ status, exited_at: status === 'exited' ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/yard', 'page');
  return {};
}

export async function updateTruckWeights(
  id: string,
  input: WeightsInput,
): Promise<{ error?: string }> {
  const parsed = weightsSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('yard_trucks').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/yard', 'page');
  return {};
}
