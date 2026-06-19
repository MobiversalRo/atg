/** Canonical area is stored in square metres; UI displays hectares. */
export const sqmToHa = (sqm: number): number => sqm / 10_000;

/** Hectares -> whole square metres (storage unit). */
export const haToSqm = (ha: number): number => Math.round(ha * 10_000);

/** Display a sqm value as hectares with 2 decimals. */
export const formatHa = (sqm: number): string => `${sqmToHa(sqm).toFixed(2)} ha`;
