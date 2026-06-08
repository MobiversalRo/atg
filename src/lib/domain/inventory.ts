/** Occupancy of a storage facility as a percentage, clamped to 0..100. */
export const fillPercent = (load: number, capacity: number): number =>
  capacity <= 0 ? 0 : Math.min(100, Math.max(0, (load / capacity) * 100));
