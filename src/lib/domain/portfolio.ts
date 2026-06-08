/** Sum of accounting values grouped by currency code (RON, EUR, ...). */
export const portfolioByCurrency = (
  rows: { accounting_value: number; currency: string }[],
): Record<string, number> =>
  rows.reduce<Record<string, number>>(
    (acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] ?? 0) + r.accounting_value }),
    {},
  );

/** Total area in square metres, converting hectares (1 ha = 10,000 m²). */
export const totalAreaSqm = (
  rows: { area_value: number; area_unit: string }[],
): number =>
  rows.reduce(
    (acc, r) => acc + (r.area_unit === 'hectare' ? r.area_value * 10_000 : r.area_value),
    0,
  );
