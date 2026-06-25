export type ArendatParts = {
  tenant: string;
  contractNumber: string | null;
  contractDate: string | null; // ISO yyyy-mm-dd
};

// Matches a trailing "<num>/<dd.mm.yyyy>" contract reference.
const CONTRACT = /\s+(\d+)\/(\d{2})\.(\d{2})\.(\d{4})\s*$/;

export function splitArendatCell(cell: string): ArendatParts | null {
  const text = cell.trim();
  if (!text) return null;
  const m = text.match(CONTRACT);
  if (!m) return { tenant: text, contractNumber: null, contractDate: null };
  const [, num, dd, mm, yyyy] = m;
  return {
    tenant: text.replace(CONTRACT, '').trim(),
    contractNumber: num,
    contractDate: `${yyyy}-${mm}-${dd}`,
  };
}
