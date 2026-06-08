function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize rows to CSV using the given column order. Header-only when empty. */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: (keyof T)[],
): string {
  const header = columns.map((c) => escapeCell(c as string)).join(',');
  const body = rows
    .map((r) => columns.map((c) => escapeCell(r[c])).join(','))
    .join('\n');
  return body ? `${header}\n${body}` : header;
}
