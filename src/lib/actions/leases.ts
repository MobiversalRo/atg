'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { leaseSchema, type Lease, type LeaseInput } from '@/lib/farm/schema';

export type LeaseRow = Lease & { parcel_code: string | null };

export async function listLeases(): Promise<{ data: LeaseRow[]; error?: string }> {
  const supabase = await createClient();
  const [{ data: leases, error }, { data: parcels }] = await Promise.all([
    supabase.from('leases').select('*').order('expiry_date'),
    supabase.from('parcels').select('id, topo_code'),
  ]);
  if (error) return { data: [], error: error.message };
  const pMap = new Map((parcels ?? []).map((p) => [p.id, p.topo_code]));
  const rows = (leases ?? []).map((l) => ({
    ...l,
    parcel_code: l.parcel_id ? (pMap.get(l.parcel_id) ?? null) : null,
  }));
  return { data: rows };
}

export async function createLease(input: LeaseInput): Promise<{ error?: string }> {
  const parsed = leaseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('leases').insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}

export async function updateLease(id: string, input: LeaseInput): Promise<{ error?: string }> {
  const parsed = leaseSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { error } = await supabase.from('leases').update(parsed.data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}

export async function deleteLease(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('leases').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}
