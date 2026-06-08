'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { stockTxnSchema, type Crop, type StockTxnInput } from '@/lib/farm/schema';
import { computeSiloBoard, type SiloSegment } from '@/lib/domain/siloboard';

export type EnrichedSegment = SiloSegment & { name: string; color: string };
export type SiloViewEnriched = {
  id: string;
  name: string;
  capacity: number;
  load: number;
  fillPct: number;
  segments: EnrichedSegment[];
};

export async function getSiloBoard(): Promise<{ silos: SiloViewEnriched[]; crops: Crop[] }> {
  const supabase = await createClient();
  const [{ data: facilities }, { data: txns }, { data: crops }] = await Promise.all([
    supabase.from('storage_facilities').select('*').order('name'),
    supabase.from('stock_transactions').select('facility_id, crop_id, txn_type, quantity_ton'),
    supabase.from('crops').select('*').order('name'),
  ]);

  const cropMap = new Map((crops ?? []).map((c) => [c.id, c]));
  const board = computeSiloBoard(
    facilities ?? [],
    (txns ?? []).map((t) => ({
      facility_id: t.facility_id,
      crop_id: t.crop_id,
      txn_type: t.txn_type,
      quantity_ton: Number(t.quantity_ton),
    })),
  );

  const silos = board.map((s) => ({
    ...s,
    segments: s.segments.map((seg) => ({
      ...seg,
      name: cropMap.get(seg.cropId)?.name ?? '',
      color: cropMap.get(seg.cropId)?.color ?? '#888888',
    })),
  }));

  return { silos, crops: crops ?? [] };
}

export async function recordStockTransaction(input: StockTxnInput): Promise<{ error?: string }> {
  const parsed = stockTxnSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('stock_transactions')
    .insert({ ...parsed.data, created_by: user?.id ?? null });
  if (error) return { error: error.message };
  revalidatePath('/[locale]/farm', 'page');
  return {};
}
