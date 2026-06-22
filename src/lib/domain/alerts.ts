import { daysUntil } from '@/lib/domain/leases';

export type AlertStatus = 'none' | 'due' | 'overdue';

/** Classify a lease for alerting: overdue (past + unpaid), due (within leadDays), or none. */
export function leaseAlertStatus(
  expiry: string | null,
  paymentStatus: 'paid' | 'unpaid' | string,
  leadDays: number,
  from: Date = new Date(),
): AlertStatus {
  if (!expiry || paymentStatus === 'paid') return 'none';
  const d = daysUntil(expiry, from);
  if (d < 0) return 'overdue';
  if (d <= leadDays) return 'due';
  return 'none';
}
