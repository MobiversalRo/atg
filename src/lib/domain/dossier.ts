export type ParsedDossier = { number: string; date: string; holder: string };

const RE = /^Dosar\s+(\d+)\s*-\s*(\d{2})\.(\d{2})\.(\d{4})\s+(.+)$/;

export function parseDossierFolderName(name: string): ParsedDossier | null {
  const m = name.trim().replace(/\s+/g, ' ').match(RE);
  if (!m) return null;
  const [, num, dd, mm, yyyy, holder] = m;
  return { number: num, date: `${yyyy}-${mm}-${dd}`, holder: holder.trim() };
}
