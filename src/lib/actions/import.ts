'use server';

import { createClient } from '@/lib/supabase/server';
import { parseCsv } from '@/lib/csv';
import { mapImportRow, type AreaUnit } from '@/lib/domain/import';

export type ImportResult = { inserted: number; skipped: number; errors: string[] };

/**
 * Import parcels (and their leases, split from the ARENDAT cell) from one CSV
 * sheet. `unit` is that sheet's area unit; `dossierNumber` links every row to an
 * existing dossier. Admin/manager only (enforced by RLS).
 */
export async function importParcels(
  csvText: string,
  unit: AreaUnit,
  dossierNumber?: string,
): Promise<ImportResult> {
  const supabase = await createClient();
  const rows = parseCsv(csvText);

  const { data: cats } = await supabase.from('land_categories').select('id, code');
  const catId = new Map((cats ?? []).map((c) => [c.code, c.id]));

  let dossierId: string | null = null;
  if (dossierNumber) {
    const { data: d } = await supabase
      .from('dossiers')
      .select('id')
      .eq('dossier_number', dossierNumber)
      .maybeSingle();
    dossierId = d?.id ?? null;
  }

  const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };
  for (const raw of rows) {
    const m = mapImportRow(raw, unit);
    if (!m.topo_code && !m.cf_current) {
      result.skipped++;
      continue;
    }
    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert({
        uat: m.uat,
        cf_current: m.cf_current,
        topo_code: m.topo_code || m.cf_current || '—',
        tp: m.tp,
        area_sqm: m.area_sqm,
        category_id: m.category_code ? (catId.get(m.category_code) ?? null) : null,
        ipotecat_holder: m.ipotecat_holder,
        vanzator: m.vanzator,
        notes: m.observatii,
        dossier_id: dossierId,
      })
      .select('id')
      .single();
    if (error || !parcel) {
      result.errors.push(error?.message ?? 'insert failed');
      continue;
    }
    await supabase
      .from('audit_log')
      .insert({ entity: 'parcel', entity_id: parcel.id, action: 'create' });
    if (m.arendat) {
      await supabase.from('leases').insert({
        parcel_id: parcel.id,
        owner_name: m.arendat.tenant,
        contract_number: m.arendat.contractNumber,
        start_date: m.arendat.contractDate,
        payment_method: 'cash',
        payment_status: 'unpaid',
      });
    }
    result.inserted++;
  }
  return result;
}
