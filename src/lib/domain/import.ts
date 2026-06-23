import { haToSqm } from '@/lib/domain/area';
import { splitArendatCell, type ArendatParts } from '@/lib/domain/arendat';

export type AreaUnit = 'sqm' | 'hectare';
export type RawRow = Record<string, string>;

export type MappedParcel = {
  uat: string | null;
  cf_current: string | null;
  topo_code: string;
  tp: string | null;
  area_sqm: number;
  category_code: string | null;
  vanzator: string | null;
  ipotecat_holder: string | null;
  observatii: string | null;
  arendat: ArendatParts | null;
};

const trimv = (s: string | undefined) => (s ?? '').trim();
const nullable = (s: string | undefined) => {
  const v = trimv(s);
  return v === '' ? null : v;
};
const stripDiacritics = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Map one raw Excel/CSV row (client's column headers) to a normalized parcel.
 * `unit` is the sheet's area unit; area is normalized to canonical m². The
 * controlled-list category code is derived from free text (ARABIL/arabil -> arabil).
 */
export function mapImportRow(raw: RawRow, unit: AreaUnit): MappedParcel {
  const rawArea = Number(trimv(raw['SUPRAFATA']).replace(',', '.')) || 0;
  const cat = nullable(raw['CAT FOLOSINTA']);
  return {
    uat: nullable(raw['UAT']),
    cf_current: nullable(raw['CF']),
    topo_code: trimv(raw['Nr. TOP']),
    tp: nullable(raw['TP']),
    area_sqm: unit === 'hectare' ? haToSqm(rawArea) : Math.round(rawArea),
    category_code: cat ? stripDiacritics(cat) : null,
    vanzator: nullable(raw['VANZATOR']),
    ipotecat_holder: nullable(raw['IPOTECAT']),
    observatii: nullable(raw['OBSERVATII']),
    arendat: splitArendatCell(trimv(raw['ARENDAT'])),
  };
}
