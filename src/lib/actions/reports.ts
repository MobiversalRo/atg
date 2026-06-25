'use server';

import { createClient } from '@/lib/supabase/server';
import { sqmToHa } from '@/lib/domain/area';
import { leaseAlertStatus } from '@/lib/domain/alerts';

export type PortfolioReport = {
  totalParcels: number;
  totalAreaHa: number;
  areaByUat: { key: string; ha: number }[];
  areaByStatus: { key: string; ha: number }[];
  leasesDueSoon: number;
};

export async function portfolioReport(): Promise<PortfolioReport> {
  const supabase = await createClient();
  const [{ data: parcels }, { data: leases }] = await Promise.all([
    supabase.from('parcels').select('uat, intabulare_status, area_sqm').is('archived_at', null),
    supabase.from('leases').select('expiry_date, payment_status'),
  ]);
  const rows = parcels ?? [];

  const groupHa = (key: 'uat' | 'intabulare_status') => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r[key] as string | null) ?? '—';
      m.set(k, (m.get(k) ?? 0) + sqmToHa(r.area_sqm ?? 0));
    }
    return [...m.entries()]
      .map(([k, ha]) => ({ key: k, ha: Number(ha.toFixed(2)) }))
      .sort((a, b) => b.ha - a.ha);
  };

  const leasesDueSoon = (leases ?? []).filter(
    (l) => leaseAlertStatus(l.expiry_date, l.payment_status, 60) !== 'none',
  ).length;

  return {
    totalParcels: rows.length,
    totalAreaHa: Number(rows.reduce((s, r) => s + sqmToHa(r.area_sqm ?? 0), 0).toFixed(2)),
    areaByUat: groupHa('uat'),
    areaByStatus: groupHa('intabulare_status'),
    leasesDueSoon,
  };
}
