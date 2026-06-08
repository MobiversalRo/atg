/** Sum areas split by unit (agricultural land in hectares, buildings in sqm). */
export const areaByUnit = (
  rows: { area_value: number; area_unit: string }[],
): { sqm: number; hectare: number } =>
  rows.reduce(
    (acc, r) => {
      if (r.area_unit === 'hectare') acc.hectare += r.area_value;
      else acc.sqm += r.area_value;
      return acc;
    },
    { sqm: 0, hectare: 0 },
  );

/** Net tons currently in stock per crop, from the transaction ledger. */
export const stockByCrop = (
  txns: { crop_id: string; txn_type: 'in' | 'out'; quantity_ton: number }[],
): Record<string, number> =>
  txns.reduce<Record<string, number>>((acc, t) => {
    acc[t.crop_id] = (acc[t.crop_id] ?? 0) + (t.txn_type === 'in' ? t.quantity_ton : -t.quantity_ton);
    return acc;
  }, {});
