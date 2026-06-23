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

/**
 * Parse CSV text into row objects keyed by the trimmed header row.
 * Handles quoted fields, embedded commas/newlines, and "" escapes.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const norm = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i];
    if (inQuotes) {
      if (c === '"') {
        if (norm[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? '').trim()])));
}
