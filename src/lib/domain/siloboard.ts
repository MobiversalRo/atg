import { fillPercent } from './inventory';

export type Facility = { id: string; name: string; max_capacity_ton: number; current_load_ton: number };
export type StockTxn = {
  facility_id: string;
  crop_id: string;
  txn_type: 'in' | 'out';
  quantity_ton: number;
};
export type SiloSegment = { cropId: string; tons: number; startPct: number; endPct: number };
export type SiloView = {
  id: string;
  name: string;
  capacity: number;
  load: number;
  fillPct: number;
  segments: SiloSegment[];
};

/**
 * Build the SiloBoard view: per facility, the overall fill % plus a per-crop
 * breakdown expressed as ring segments (each crop's share of capacity).
 */
export function computeSiloBoard(facilities: Facility[], txns: StockTxn[]): SiloView[] {
  return facilities.map((f) => {
    const perCrop = new Map<string, number>();
    for (const t of txns) {
      if (t.facility_id !== f.id) continue;
      const delta = t.txn_type === 'in' ? t.quantity_ton : -t.quantity_ton;
      perCrop.set(t.crop_id, (perCrop.get(t.crop_id) ?? 0) + delta);
    }

    const capacity = f.max_capacity_ton;
    let cursor = 0;
    const segments: SiloSegment[] = [];
    for (const [cropId, tons] of perCrop) {
      if (tons <= 0) continue;
      const startPct = capacity > 0 ? (cursor / capacity) * 100 : 0;
      cursor += tons;
      const endPct = capacity > 0 ? Math.min(100, (cursor / capacity) * 100) : 0;
      segments.push({ cropId, tons, startPct, endPct });
    }

    return {
      id: f.id,
      name: f.name,
      capacity,
      load: f.current_load_ton,
      fillPct: fillPercent(f.current_load_ton, capacity),
      segments,
    };
  });
}
