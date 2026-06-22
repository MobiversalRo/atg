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

export type LeaseBillingRow = {
  id: string;
  owner_name: string;
  contract_number: string | null;
  expiry_date: string | null;
  amount: number | null;
  payment_status: 'paid' | 'unpaid';
  parcel_label: string | null;
  area_sqm: number;
};

/** Lease rows enriched with parcel CF + area for the billing-support view (CF-9). */
export async function listLeaseBilling(): Promise<{ data: LeaseBillingRow[]; error?: string }> {
  const supabase = await createClient();
  const [{ data: leases, error }, { data: parcels }] = await Promise.all([
    supabase.from('leases').select('*').order('expiry_date', { ascending: true }),
    supabase.from('parcels').select('id, cf_current, topo_code, area_sqm'),
  ]);
  if (error) return { data: [], error: error.message };
  const pMap = new Map((parcels ?? []).map((p) => [p.id, p]));
  const rows = (leases ?? []).map((l) => {
    const p = l.parcel_id ? pMap.get(l.parcel_id) : null;
    return {
      id: l.id,
      owner_name: l.owner_name,
      contract_number: l.contract_number,
      expiry_date: l.expiry_date,
      amount: l.amount,
      payment_status: l.payment_status,
      parcel_label: p ? (p.cf_current ?? p.topo_code) : null,
      area_sqm: p?.area_sqm ?? 0,
    };
  });
  return { data: rows };
}

/** Quick paid/unpaid toggle for the billing view (CF-9). RLS is the real boundary. */
export async function setLeasePaymentStatus(
  id: string,
  status: 'paid' | 'unpaid',
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('leases').update({ payment_status: status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}
