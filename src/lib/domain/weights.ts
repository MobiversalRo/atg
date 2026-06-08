/** Net cargo weight; never negative (a tare heavier than gross means no cargo yet). */
export const netWeight = (gross = 0, tare = 0): number => Math.max(0, gross - tare);
