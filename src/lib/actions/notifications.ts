'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { leaseAlertStatus } from '@/lib/domain/alerts';
import type { Enums } from '@/lib/supabase/types';

/** Idempotently create due/overdue lease notifications and target them at lease/billing staff. */
export async function generateLeaseNotifications(
  leadDays = 30,
): Promise<{ created: number; error?: string }> {
  const supabase = await createClient();
  const { data: leases, error } = await supabase
    .from('leases')
    .select('id, expiry_date, payment_status');
  if (error) return { created: 0, error: error.message };

  const { data: staff } = await supabase
    .from('profiles')
    .select('id')
    // 'accountant' is a valid DB role (CF-10) but the generated user_role enum is
    // stale, so cast the filter values to the generated enum element type.
    .in('role', ['admin', 'manager', 'accountant'] as Enums<'user_role'>[]);
  const recipientIds = (staff ?? []).map((s) => s.id);

  let created = 0;
  for (const l of leases ?? []) {
    const status = leaseAlertStatus(l.expiry_date, l.payment_status, leadDays);
    if (status === 'none') continue;
    const type = status === 'overdue' ? 'lease_overdue' : 'lease_due';
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('lease_id', l.id)
      .eq('type', type)
      .is('read_at', null)
      .maybeSingle();
    if (existing) continue;
    const { data: notif, error: insErr } = await supabase
      .from('notifications')
      .insert({ type, lease_id: l.id, due_date: l.expiry_date, lead_days: leadDays, status: l.payment_status })
      .select('id')
      .single();
    if (insErr || !notif) continue;
    if (recipientIds.length) {
      await supabase
        .from('notification_recipients')
        .insert(recipientIds.map((pid) => ({ notification_id: notif.id, profile_id: pid })));
    }
    created++;
  }
  revalidatePath('/[locale]', 'page');
  return { created };
}

export type MyNotification = {
  id: string;
  type: 'lease_due' | 'lease_overdue';
  due_date: string | null;
  lease_id: string | null;
};

export async function listMyNotifications(): Promise<MyNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, type, due_date, lease_id')
    .is('read_at', null)
    .order('due_date', { ascending: true });
  return (data ?? []) as MyNotification[];
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]', 'page');
  return {};
}
