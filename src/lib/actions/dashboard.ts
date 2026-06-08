'use server';

import { createClient } from '@/lib/supabase/server';
import { portfolioByCurrency } from '@/lib/domain/portfolio';
import { areaByUnit, stockByCrop } from '@/lib/domain/dashboard';
import { isExpiringSoon } from '@/lib/domain/leases';

export type DashboardData = {
  area: { sqm: number; hectare: number };
  patrimony: Record<string, number>;
  stock: { name: string; color: string; tons: number }[];
  expiringLeases: { id: string; owner_name: string; expiry_date: string }[];
};

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await createClient();
  const [{ data: props }, { data: leases }, { data: txns }, { data: crops }] = await Promise.all([
    supabase.from('properties').select('area_value, area_unit, accounting_value, currency'),
    supabase.from('leases').select('id, owner_name, expiry_date'),
    supabase.from('stock_transactions').select('crop_id, txn_type, quantity_ton'),
    supabase.from('crops').select('id, name, color'),
  ]);

  const area = areaByUnit(
    (props ?? []).map((p) => ({ area_value: Number(p.area_value), area_unit: p.area_unit })),
  );
  const patrimony = portfolioByCurrency(
    (props ?? []).map((p) => ({
      accounting_value: Number(p.accounting_value),
      currency: p.currency,
    })),
  );

  const byCrop = stockByCrop(
    (txns ?? []).map((t) => ({
      crop_id: t.crop_id,
      txn_type: t.txn_type,
      quantity_ton: Number(t.quantity_ton),
    })),
  );
  const cropMap = new Map((crops ?? []).map((c) => [c.id, c]));
  const stock = Object.entries(byCrop)
    .filter(([, tons]) => tons > 0)
    .map(([id, tons]) => ({
      name: cropMap.get(id)?.name ?? '',
      color: cropMap.get(id)?.color ?? '#888888',
      tons,
    }))
    .sort((a, b) => b.tons - a.tons);

  const expiringLeases = (leases ?? [])
    .filter((l) => l.expiry_date && isExpiringSoon(l.expiry_date, 60))
    .map((l) => ({ id: l.id, owner_name: l.owner_name, expiry_date: l.expiry_date as string }));

  return { area, patrimony, stock, expiringLeases };
}
