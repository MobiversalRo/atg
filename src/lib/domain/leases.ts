const MS_PER_DAY = 86_400_000;

/** Whole days from `from` until `date` (negative if already past). */
export const daysUntil = (date: string | Date, from: Date = new Date()): number =>
  Math.round((new Date(date).getTime() - from.getTime()) / MS_PER_DAY);

/** True when a lease/contract expires within `within` days and has not yet passed. */
export const isExpiringSoon = (
  date: string | Date,
  within = 60,
  from: Date = new Date(),
): boolean => {
  const d = daysUntil(date, from);
  return d >= 0 && d <= within;
};
