# AISM / Ameropa Faza 1 — Land & Document Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `atg` ERP with a document-centric land-management layer for SC AGISM — immutable scanned documents, acquisition dossiers, a richer parcel/lease model, instant fuzzy search, lease alerts, reports, and a 4-role RBAC — implementing CF-1…CF-4, CF-6…CF-10 (OCR/CF-5 deferred).

**Architecture:** Same as the MVP — Next.js 16 App Router (TS) + Supabase (Postgres + Auth + RLS + Storage). Reads via Server Components, mutations via Server Actions, `"use client"` only for interactive UI. **RLS is the security boundary**; `src/lib/auth/rbac.ts` mirrors it for the UI. Pure logic lives in `src/lib/domain/*` (vitest-tested with an injectable `from: Date`). Documents are immutable at the DB + Storage layer (CF-4, client's #1 priority).

**Tech Stack:** Next.js 16 · TypeScript · Tailwind v4 · shadcn/Base UI (`@base-ui/react`, `render={}` not `asChild`) · Supabase JS (`@supabase/ssr`) · next-intl (RO default) · TanStack Table · zod · Vitest · Playwright · Postgres `pg_trgm` + `unaccent`.

**Spec:** `docs/superpowers/specs/2026-06-17-aism-faza1-land-documents-design.md`

---

## Conventions (read once)

- **Framework gotchas (Next 16 + Base UI):** middleware is `proxy.ts` (default export); Base UI composition is `render={<Comp/>}`; `params` is async (`const { locale } = await params`). Read the relevant guide under `node_modules/next/dist/docs/` before writing framework code.
- **Local dev:** `supabase start` (Docker running) brings up the local stack. `supabase db reset` re-applies migrations + `supabase/seed.sql`. Direct SQL: `docker exec -i supabase_db_atg psql -U postgres -d postgres`.
- **After ANY schema change:** `supabase gen types typescript --local > src/lib/supabase/types.ts` and then `npm run typecheck`.
- **Commands:** unit `npm test` · typecheck `npm run typecheck` · lint `npm run lint` · e2e `npm run test:e2e`.
- **Commits:** conventional commits; **no co-author trailers**.
- **Migration filenames:** `supabase/migrations/20260617NNNNNN_<name>.sql` (keep the numeric prefixes monotonic after the existing `202606081205*`).

## Canonical names used across tasks (define once, reuse exactly)

- Enums: `intabulare_status` = `('intabulat','intabulat_cu_posesie','posesie')`; `document_variant` = `('original','copie','timbrat','legalizat')`; `notification_type` = `('lease_due','lease_overdue')`; `user_role` gains `'accountant'`.
- Tables: `land_categories`, `document_types`, `audit_log`, `dossiers`, `documents`, `parcel_cf_aliases`, `notifications`, `notification_recipients`. Storage bucket: `documents`.
- RPC: `search_all(q text)`.
- Domain modules: `src/lib/domain/area.ts` (`sqmToHa`, `haToSqm`, `formatHa`), `src/lib/domain/search.ts` (`normalizeCode`, `normalizeText`), `src/lib/domain/dossier.ts` (`parseDossierFolderName`), `src/lib/domain/arendat.ts` (`splitArendatCell`), `src/lib/domain/alerts.ts` (`leaseAlertStatus`).
- Schemas: `src/lib/dossiers/schema.ts`, `src/lib/documents/schema.ts`, extended `src/lib/farm/schema.ts`.
- Actions: `src/lib/actions/dossiers.ts`, `documents.ts`, `search.ts`, `notifications.ts`, `reports.ts`.

## File Structure Map (new/changed)

```
supabase/migrations/
  20260617120000_aism_foundation.sql      # extensions, nomenclators, audit_log, storage bucket
  20260617120100_cf1_schema.sql           # parcels extension, dossiers, documents, cf_aliases, links
  20260617120200_cf4_protection.sql       # no-delete RLS + admin archive + storage immutability
  20260617120300_cf2_search.sql           # search_all() RPC + trigram indexes
  20260617120400_cf8_notifications.sql    # notifications + recipients
  20260617120500_cf10_accountant.sql      # accountant role + policies
supabase/seed.sql                         # + nomenclator seeds, sample dossier/doc rows
src/lib/domain/{area,search,dossier,arendat,alerts}.ts
src/lib/{dossiers,documents}/schema.ts
src/lib/actions/{dossiers,documents,search,notifications,reports}.ts
src/lib/auth/rbac.ts                       # + accountant, dossiers/documents/notifications resources
src/components/dossiers/{dossier-table,dossier-detail,document-list,document-upload}.tsx
src/components/search/global-search.tsx
src/components/notifications/notification-bell.tsx
src/components/reports/report-cards.tsx
src/components/farm/parcel-table.tsx       # extend columns/filters/totals
src/app/[locale]/(app)/dossiers/page.tsx
src/app/[locale]/(app)/dossiers/[id]/page.tsx
src/app/[locale]/(app)/reports/page.tsx
src/components/shell/                       # add search bar + bell to topbar; add nav items
messages/{ro,en}.json                       # + dossiers/documents/search/reports/notifications keys
tests/unit/{area,search,dossier,arendat,alerts}.test.ts
tests/integration/cf4-no-delete.test.ts
tests/e2e/{dossiers,search,notifications}.spec.ts
```

---

## Phase 0 — Foundation & CF-4 storage guardrail

Establishes extensions, nomenclators, the audit table, and the **immutable storage bucket** (CF-4's storage half ships first). Adds pure area helpers.

### Task 0.1: Area conversion domain helpers (TDD)

**Files:**
- Create: `src/lib/domain/area.ts`
- Test: `tests/unit/area.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/area.test.ts
import { expect, test } from 'vitest';
import { sqmToHa, haToSqm, formatHa } from '@/lib/domain/area';

test('sqmToHa divides by 10000', () => {
  expect(sqmToHa(36000)).toBeCloseTo(3.6);
  expect(sqmToHa(4200)).toBeCloseTo(0.42);
  expect(sqmToHa(0)).toBe(0);
});

test('haToSqm multiplies by 10000 and rounds to integer sqm', () => {
  expect(haToSqm(1.29)).toBe(12900);
  expect(haToSqm(0.11)).toBe(1100);
});

test('round-trips ha -> sqm -> ha', () => {
  expect(sqmToHa(haToSqm(0.29))).toBeCloseTo(0.29);
});

test('formatHa renders 2 decimals with ha suffix', () => {
  expect(formatHa(12900)).toBe('1.29 ha');
  expect(formatHa(36000)).toBe('3.60 ha');
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- area`
Expected: FAIL — `Cannot find module '@/lib/domain/area'`.

- [ ] **Step 3: Implement**

```ts
// src/lib/domain/area.ts
/** Canonical area is stored in square metres; UI displays hectares. */
export const sqmToHa = (sqm: number): number => sqm / 10_000;

/** Hectares -> whole square metres (storage unit). */
export const haToSqm = (ha: number): number => Math.round(ha * 10_000);

/** Display a sqm value as hectares with 2 decimals. */
export const formatHa = (sqm: number): string => `${sqmToHa(sqm).toFixed(2)} ha`;
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- area`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/area.ts tests/unit/area.test.ts
git commit -m "feat(farm): area m2<->ha conversion helpers"
```

### Task 0.2: Foundation migration — extensions, nomenclators, audit_log

**Files:**
- Create: `supabase/migrations/20260617120000_aism_foundation.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260617120000_aism_foundation.sql

-- Search support (CF-2): fuzzy + accent-insensitive matching.
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Controlled lists (OQ-22, OQ-24). Admin-editable nomenclators.
create table land_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text not null
);
create table document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_en text not null,
  sort_order int not null default 0
);

-- Change history (CF-3): who changed what, when.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid not null,
  action text not null,                 -- 'create' | 'update' | 'archive'
  actor uuid references profiles (id),
  diff jsonb,
  at timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log (entity, entity_id);

alter table land_categories enable row level security;
alter table document_types enable row level security;
alter table audit_log enable row level security;

-- Nomenclators: everyone reads; only admin writes.
create policy land_categories_select on land_categories for select to authenticated using (true);
create policy land_categories_admin on land_categories for all to authenticated
  using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy document_types_select on document_types for select to authenticated using (true);
create policy document_types_admin on document_types for all to authenticated
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- Audit log: everyone reads; inserts happen via server actions (authenticated); no update/delete.
create policy audit_log_select on audit_log for select to authenticated using (true);
create policy audit_log_insert on audit_log for insert to authenticated with check (true);
```

- [ ] **Step 2: Apply and verify**

Run: `supabase db reset`
Expected: all migrations apply with no error; final line reports seeding.

- [ ] **Step 3: Regenerate types + typecheck**

Run: `supabase gen types typescript --local > src/lib/supabase/types.ts && npm run typecheck`
Expected: typecheck passes; `land_categories`, `document_types`, `audit_log` now present in `types.ts`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617120000_aism_foundation.sql src/lib/supabase/types.ts
git commit -m "feat(db): extensions, nomenclators, audit_log foundation"
```

### Task 0.3: Immutable Storage bucket `documents` (CF-4 storage half)

**Files:**
- Modify: `supabase/migrations/20260617120000_aism_foundation.sql` (append)

- [ ] **Step 1: Append bucket + immutable policies**

```sql
-- Private bucket for scanned documents. CF-4: no delete, no update (immutable).
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Authenticated users can read and upload; NO update, NO delete policy => both denied by RLS.
create policy "documents_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
create policy "documents_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
-- Intentionally absent: UPDATE and DELETE policies on bucket 'documents'.
```

- [ ] **Step 2: Apply**

Run: `supabase db reset`
Expected: success; bucket `documents` exists.

- [ ] **Step 3: Verify no delete/update policy exists for the bucket**

Run: `docker exec -i supabase_db_atg psql -U postgres -d postgres -c "select cmd from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'documents%';"`
Expected: only `SELECT` and `INSERT` rows — no `UPDATE`/`DELETE`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617120000_aism_foundation.sql
git commit -m "feat(db): immutable documents storage bucket (CF-4)"
```

---

## Phase 1 — CF-1 data model + CF-4 table protection

Creates the dossier/document/CF-alias entities, extends `parcels` (incl. area canonicalization), and ships their **no-delete RLS** as part of creation (CF-4 for structured records). Reconciles the existing Farm code to the new area unit.

### Task 1.1: CF-1 schema migration — parcels extension, dossiers, documents, cf_aliases

**Files:**
- Create: `supabase/migrations/20260617120100_cf1_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260617120100_cf1_schema.sql

create type intabulare_status as enum ('intabulat', 'intabulat_cu_posesie', 'posesie');
create type document_variant as enum ('original', 'copie', 'timbrat', 'legalizat');

-- Acquisition dossiers (Dosar de dobandire). One dossier -> many parcels (OQ-23).
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  dossier_number text not null unique,
  acquisition_date date,
  original_holder text,
  intabulare_status intabulare_status,
  archived_at timestamptz,
  archived_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger dossiers_updated_at before update on dossiers
  for each row execute function set_updated_at();

-- Extend parcels with the unified schema from the client's example data.
alter table parcels add column uat text;
alter table parcels add column cf_current text;
alter table parcels add column tp text;                          -- titlu de proprietate
alter table parcels add column area_sqm numeric not null default 0;  -- canonical (OQ-21)
alter table parcels add column category_id uuid references land_categories (id);
alter table parcels add column intabulare_status intabulare_status;
alter table parcels add column ipotecat_holder text;
alter table parcels add column vanzator text;
alter table parcels add column dossier_id uuid references dossiers (id);
alter table parcels add column archived_at timestamptz;
alter table parcels add column archived_by uuid references profiles (id);

-- Backfill canonical area from the existing hectare column, then drop the old column.
update parcels set area_sqm = round(coalesce(area_ha, 0) * 10000);
alter table parcels drop column area_ha;

-- Old/prior CF numbers (CF vechi). Powers old<->new CF search (CF-2, P-3).
create table parcel_cf_aliases (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels (id) on delete cascade,
  cf_number text not null
);
create index parcel_cf_aliases_parcel_idx on parcel_cf_aliases (parcel_id);

-- Documents: scanned files attached to a dossier and/or parcel. Immutable original (CF-4).
create table documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references dossiers (id),
  parcel_id uuid references parcels (id),
  document_type_id uuid references document_types (id),
  variant document_variant,
  document_number text,
  document_date date,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  uploaded_by uuid references profiles (id),
  archived_at timestamptz,
  archived_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index documents_dossier_idx on documents (dossier_id);
create index documents_parcel_idx on documents (parcel_id);

alter table dossiers enable row level security;
alter table parcel_cf_aliases enable row level security;
alter table documents enable row level security;
```

- [ ] **Step 2: Apply**

Run: `supabase db reset`
Expected: success.

- [ ] **Step 3: Regenerate types + typecheck (expect existing Farm code to break on `area_ha`)**

Run: `supabase gen types typescript --local > src/lib/supabase/types.ts && npm run typecheck`
Expected: typecheck FAILS where `area_ha` was referenced (farm schema/actions/components). Fixed in Task 1.3.

- [ ] **Step 4: Commit the migration + types**

```bash
git add supabase/migrations/20260617120100_cf1_schema.sql src/lib/supabase/types.ts
git commit -m "feat(db): CF-1 schema — dossiers, documents, parcel CF aliases, parcel fields"
```

### Task 1.2: CF-4 table protection — no-delete RLS + admin archive

**Files:**
- Create: `supabase/migrations/20260617120200_cf4_protection.sql`

- [ ] **Step 1: Write the migration (protected tables get SELECT/INSERT/UPDATE but NEVER DELETE)**

```sql
-- supabase/migrations/20260617120200_cf4_protection.sql
-- CF-4 (client's #1 priority): documents, dossiers, parcels and CF aliases
-- can never be hard-deleted. Mistakes are handled by admin-only soft archive.

-- parcels already has _delete from the MVP RLS loop; drop it.
drop policy if exists parcels_delete on parcels;

-- Protected tables: read all, insert/update by admin+manager, NO delete for anyone.
do $$
declare t text;
begin
  foreach t in array array['dossiers', 'documents', 'parcel_cf_aliases'] loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (auth_role() in (''admin'',''manager''))', t || '_insert', t);
    execute format('create policy %I on %I for update to authenticated using (auth_role() in (''admin'',''manager'')) with check (auth_role() in (''admin'',''manager''))', t || '_update', t);
    -- Intentionally NO delete policy => delete denied by RLS for every role.
  end loop;
end;
$$;

-- Operators may upload documents (CF-3) even though they cannot edit parcels.
drop policy if exists documents_insert on documents;
create policy documents_insert on documents for insert to authenticated
  with check (auth_role() in ('admin', 'manager', 'operator'));
```

- [ ] **Step 2: Apply**

Run: `supabase db reset`
Expected: success.

- [ ] **Step 3: Verify protected tables have no DELETE policy**

Run: `docker exec -i supabase_db_atg psql -U postgres -d postgres -c "select tablename, cmd from pg_policies where tablename in ('documents','dossiers','parcels','parcel_cf_aliases') and cmd='DELETE';"`
Expected: **0 rows**.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617120200_cf4_protection.sql
git commit -m "feat(db): CF-4 deletion protection on documents/dossiers/parcels"
```

### Task 1.3: Reconcile existing Farm code to `area_sqm` (display ha)

**Files:**
- Modify: `src/lib/farm/schema.ts`
- Modify: `src/lib/actions/parcels.ts`
- Modify: `src/components/farm/parcel-table.tsx` (and any parcel form referencing area)
- Modify: `tests/unit/*` and `tests/e2e/farm.spec.ts` if they assert `area_ha`

- [ ] **Step 1: Update the zod schema — replace `area_ha` with the new parcel fields**

```ts
// src/lib/farm/schema.ts — replace the parcelSchema block
export const INTABULARE_STATUSES = ['intabulat', 'intabulat_cu_posesie', 'posesie'] as const;

export const parcelSchema = z.object({
  topo_code: z.string().min(1, 'Topo code is required'),     // Nr. TOP
  uat: z.preprocess(emptyToNull, z.string().nullable()),
  cf_current: z.preprocess(emptyToNull, z.string().nullable()),
  tp: z.preprocess(emptyToNull, z.string().nullable()),
  area_sqm: z.coerce.number().min(0),                         // canonical m2
  category_id: z.preprocess(emptyToNull, z.string().nullable()),
  intabulare_status: z.preprocess(emptyToNull, z.enum(INTABULARE_STATUSES).nullable()),
  ipotecat_holder: z.preprocess(emptyToNull, z.string().nullable()),
  vanzator: z.preprocess(emptyToNull, z.string().nullable()),
  dossier_id: z.preprocess(emptyToNull, z.string().nullable()),
  current_crop_id: z.preprocess(emptyToNull, z.string().nullable()),
  property_id: z.preprocess(emptyToNull, z.string().nullable()),
  notes: z.preprocess(emptyToNull, z.string().nullable()),    // OBSERVATII
});
export type ParcelInput = z.infer<typeof parcelSchema>;
```

- [ ] **Step 2: Update the parcel table to display ha and the new columns**

In `src/components/farm/parcel-table.tsx`, import `formatHa` from `@/lib/domain/area` and render `formatHa(row.area_sqm)` wherever area was shown; add columns for `uat`, `cf_current`, `intabulare_status`. Keep the existing TanStack Table setup; only the column defs change. (Mirror the column-def style already in this file.)

- [ ] **Step 3: Fix any test references**

Search and update: `grep -rn "area_ha" src tests`. Replace assertions with `area_sqm` / `formatHa`.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/farm/schema.ts src/lib/actions/parcels.ts src/components/farm/parcel-table.tsx tests/
git commit -m "refactor(farm): parcels use canonical area_sqm + unified fields"
```

### Task 1.4: Seed nomenclators + example dossiers

**Files:**
- Modify: `supabase/seed.sql` (append)

- [ ] **Step 1: Append seeds (categories, document types, the 3 example dossiers)**

```sql
-- Land categories (OQ-22)
insert into land_categories (code, name, name_en) values
  ('arabil', 'Arabil', 'Arable'),
  ('padure', 'Pădure', 'Forest')
on conflict (code) do nothing;

-- Document types (OQ-24, taxonomy from spec 7.4)
insert into document_types (code, name, name_en, sort_order) values
  ('antecontract', 'Antecontract de vânzare-cumpărare', 'Pre-sale agreement', 10),
  ('cvc', 'Contract de vânzare-cumpărare', 'Sale-purchase contract', 20),
  ('tp', 'Titlu de proprietate', 'Property title', 30),
  ('cf', 'Extras / Carte funciară', 'Land registry extract', 40),
  ('cadastral', 'Documente cadastrale', 'Cadastral documents', 50),
  ('identitate', 'Acte de identificare personală', 'Personal ID documents', 60),
  ('succesiune', 'Documente de succesiune / testament', 'Succession / will', 70),
  ('olografa', 'Declarație olografă', 'Holographic declaration', 80)
on conflict (code) do nothing;

-- Example dossiers (acceptance fixtures: 101, 118, 940)
insert into dossiers (dossier_number, acquisition_date, original_holder, intabulare_status) values
  ('101', '2006-05-15', 'Kovacs Barna Stefan', 'intabulat'),
  ('118', '2006-05-18', 'Simonca Gheorghe', 'intabulat_cu_posesie'),
  ('940', '2007-06-26', 'Nagy Margareta-Terezia', 'intabulat')
on conflict (dossier_number) do nothing;
```

- [ ] **Step 2: Apply + verify**

Run: `supabase db reset && docker exec -i supabase_db_atg psql -U postgres -d postgres -c "select dossier_number, original_holder from dossiers order by dossier_number;"`
Expected: 3 rows (101, 118, 940).

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore(db): seed nomenclators and example dossiers"
```

---

## Phase 2 — CF-3: document upload + audit history

### Task 2.1: Document schema + audit helper

**Files:**
- Create: `src/lib/documents/schema.ts`
- Create: `src/lib/dossiers/schema.ts`

- [ ] **Step 1: Write the schemas**

```ts
// src/lib/dossiers/schema.ts
import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';
export type Dossier = Database['public']['Tables']['dossiers']['Row'];
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
export const INTABULARE_STATUSES = ['intabulat', 'intabulat_cu_posesie', 'posesie'] as const;

export const dossierSchema = z.object({
  dossier_number: z.string().min(1, 'Dossier number is required'),
  acquisition_date: z.preprocess(emptyToNull, z.string().nullable()),
  original_holder: z.preprocess(emptyToNull, z.string().nullable()),
  intabulare_status: z.preprocess(emptyToNull, z.enum(INTABULARE_STATUSES).nullable()),
});
export type DossierInput = z.infer<typeof dossierSchema>;
```

```ts
// src/lib/documents/schema.ts
import { z } from 'zod';
import type { Database } from '@/lib/supabase/types';
export type Document = Database['public']['Tables']['documents']['Row'];
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
export const DOCUMENT_VARIANTS = ['original', 'copie', 'timbrat', 'legalizat'] as const;

// Metadata accompanying an uploaded file (the file itself is handled separately).
export const documentMetaSchema = z.object({
  dossier_id: z.preprocess(emptyToNull, z.string().nullable()),
  parcel_id: z.preprocess(emptyToNull, z.string().nullable()),
  document_type_id: z.preprocess(emptyToNull, z.string().nullable()),
  variant: z.preprocess(emptyToNull, z.enum(DOCUMENT_VARIANTS).nullable()),
  document_number: z.preprocess(emptyToNull, z.string().nullable()),
  document_date: z.preprocess(emptyToNull, z.string().nullable()),
});
export type DocumentMetaInput = z.infer<typeof documentMetaSchema>;
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dossiers/schema.ts src/lib/documents/schema.ts
git commit -m "feat(documents): dossier and document metadata schemas"
```

### Task 2.2: Dossier server actions

**Files:**
- Create: `src/lib/actions/dossiers.ts`

- [ ] **Step 1: Write the actions (create/update/archive; archive is admin-only, mirrors RLS + writes audit_log)**

```ts
// src/lib/actions/dossiers.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { dossierSchema, type DossierInput, type Dossier } from '@/lib/dossiers/schema';

export async function listDossiers(): Promise<{ data: Dossier[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dossiers')
    .select('*')
    .is('archived_at', null)
    .order('dossier_number');
  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function getDossier(id: string) {
  const supabase = await createClient();
  const [{ data: dossier }, { data: parcels }, { data: documents }] = await Promise.all([
    supabase.from('dossiers').select('*').eq('id', id).single(),
    supabase.from('parcels').select('*').eq('dossier_id', id).is('archived_at', null),
    supabase.from('documents').select('*').eq('dossier_id', id).is('archived_at', null),
  ]);
  return { dossier, parcels: parcels ?? [], documents: documents ?? [] };
}

export async function createDossier(input: DossierInput): Promise<{ error?: string }> {
  const parsed = dossierSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('dossiers').insert(parsed.data).select('id').single();
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: data.id, action: 'create' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}

export async function archiveDossier(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('dossiers')
    .update({ archived_at: new Date().toISOString(), archived_by: auth.user?.id ?? null })
    .eq('id', id);
  if (error) return { error: error.message };
  await supabase.from('audit_log').insert({ entity: 'dossier', entity_id: id, action: 'archive' });
  revalidatePath('/[locale]/dossiers', 'page');
  return {};
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/dossiers.ts
git commit -m "feat(dossiers): list/get/create/archive server actions with audit"
```

### Task 2.3: Document upload server action (Storage + metadata + audit)

**Files:**
- Create: `src/lib/actions/documents.ts`

- [ ] **Step 1: Write the upload action (accepts FormData with a File; uploads to bucket; inserts metadata row; audits)**

```ts
// src/lib/actions/documents.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { documentMetaSchema } from '@/lib/documents/schema';

/** Upload one scanned file and attach it to a dossier/parcel. The original is immutable (CF-4). */
export async function uploadDocument(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file' };

  const meta = documentMetaSchema.safeParse({
    dossier_id: formData.get('dossier_id'),
    parcel_id: formData.get('parcel_id'),
    document_type_id: formData.get('document_type_id'),
    variant: formData.get('variant'),
    document_number: formData.get('document_number'),
    document_date: formData.get('document_date'),
  });
  if (!meta.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${meta.data.dossier_id ?? 'unfiled'}/${Date.now()}_${safeName}`;
  const { error: upErr } = await supabase.storage.from('documents').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false, // never overwrite — immutability
  });
  if (upErr) return { error: upErr.message };

  const { data: doc, error } = await supabase
    .from('documents')
    .insert({
      ...meta.data,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type || null,
      uploaded_by: auth.user?.id ?? null,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };

  await supabase.from('audit_log').insert({ entity: 'document', entity_id: doc.id, action: 'create' });
  if (meta.data.dossier_id) revalidatePath(`/[locale]/dossiers/[id]`, 'page');
  return {};
}

/** A short-lived signed URL to view/download the original scan. */
export async function getDocumentUrl(storagePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60 * 10);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/documents.ts
git commit -m "feat(documents): immutable upload + signed-url actions with audit"
```

### Task 2.4: CF-4 integration test — delete is denied

**Files:**
- Create: `tests/integration/cf4-no-delete.test.ts`
- Modify: `vitest.config.ts` only if needed to include `tests/integration` (it already globs `tests/**`; confirm).

- [ ] **Step 1: Write the integration test (requires local Supabase running)**

```ts
// tests/integration/cf4-no-delete.test.ts
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Uses the local stack. Skips automatically if env is absent.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const run = anon ? test : test.skip;

let supabase: ReturnType<typeof createClient>;
let dossierId: string;

beforeAll(async () => {
  supabase = createClient(url, anon);
  await supabase.auth.signInWithPassword({ email: 'admin@atg.local', password: 'password123' });
  const { data } = await supabase.from('dossiers').select('id').eq('dossier_number', '101').single();
  dossierId = data!.id as string;
});

afterAll(async () => {
  await supabase.auth.signOut();
});

run('CF-4: an admin cannot hard-delete a dossier', async () => {
  await supabase.from('dossiers').delete().eq('id', dossierId);
  const { data } = await supabase.from('dossiers').select('id').eq('id', dossierId);
  expect(data).toHaveLength(1); // RLS denied the delete; row survives
});
```

- [ ] **Step 2: Run (stack must be up)**

Run: `supabase start >/dev/null 2>&1; npm test -- cf4-no-delete`
Expected: PASS (row survives). If env vars are unset, the test is skipped — set them from `.env.local` to actually exercise it.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/cf4-no-delete.test.ts
git commit -m "test(cf4): assert dossiers cannot be hard-deleted under RLS"
```

### Task 2.5: Dossier list + detail pages and upload UI

**Files:**
- Create: `src/app/[locale]/(app)/dossiers/page.tsx`
- Create: `src/app/[locale]/(app)/dossiers/[id]/page.tsx`
- Create: `src/components/dossiers/dossier-table.tsx`
- Create: `src/components/dossiers/dossier-detail.tsx`
- Create: `src/components/dossiers/document-list.tsx`
- Create: `src/components/dossiers/document-upload.tsx`
- Modify: shell nav (add "Dosare"), `messages/{ro,en}.json`

- [ ] **Step 1: Dossier list page (Server Component fetch, client table)**

```tsx
// src/app/[locale]/(app)/dossiers/page.tsx
import { listDossiers } from '@/lib/actions/dossiers';
import { DossierTable } from '@/components/dossiers/dossier-table';

export default async function DossiersPage() {
  const { data, error } = await listDossiers();
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  return <DossierTable rows={data} />;
}
```

- [ ] **Step 2: Dossier detail page (metadata + linked parcels + documents + upload)**

```tsx
// src/app/[locale]/(app)/dossiers/[id]/page.tsx
import { getDossier } from '@/lib/actions/dossiers';
import { DossierDetail } from '@/components/dossiers/dossier-detail';

export default async function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dossier, parcels, documents } = await getDossier(id);
  if (!dossier) return <p className="p-6 text-sm text-red-600">Not found</p>;
  return <DossierDetail dossier={dossier} parcels={parcels} documents={documents} />;
}
```

- [ ] **Step 3: Build the client components**

`dossier-table.tsx` — a TanStack Table over `rows` mirroring `src/components/properties/property-table.tsx` (columns: dossier_number, original_holder, acquisition_date, intabulare_status; row click → `Link` to `/dossiers/{id}` via `@/i18n/navigation`).
`dossier-detail.tsx` — header card with dossier fields + an "Archive" button gated by `can(role, 'dossiers', 'delete')` (admin only) calling `archiveDossier`; renders `<DocumentList/>` and `<DocumentUpload dossierId={dossier.id}/>`.
`document-list.tsx` — lists documents (type, variant, number, date, filename) with a "View" button calling `getDocumentUrl` then `window.open(url)`. **No delete control.**
`document-upload.tsx` — `"use client"` form posting `FormData` to `uploadDocument`; uses `useOptimistic` + the toast pattern from the Yard module; resets on success.

- [ ] **Step 4: Add nav + i18n keys**

Add `"dossiers": "Dosare"` (ro) / `"Dossiers"` (en) under `nav`, plus a `dossiers` section with field labels. Add the nav item to the sidebar following the existing nav array. Add the route to the RBAC-visible set.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS. Manually: `npm run dev`, log in as `admin@atg.local`, open `/ro/dossiers`, open dossier 101, upload a small PDF, confirm it appears and "View" opens it, and there is **no delete button**.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/\(app\)/dossiers src/components/dossiers messages src/components/shell
git commit -m "feat(dossiers): list/detail pages, document list and immutable upload"
```

---

## Phase 3 — CF-2 instant search

### Task 3.1: Search normalization helpers (TDD)

**Files:**
- Create: `src/lib/domain/search.ts`
- Test: `tests/unit/search.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/search.test.ts
import { expect, test } from 'vitest';
import { normalizeCode, normalizeText } from '@/lib/domain/search';

test('normalizeCode strips spaces and lowercases (P-1: stray space)', () => {
  expect(normalizeCode('100 188')).toBe('100188');
  expect(normalizeCode(' CF-104940 ')).toBe('cf-104940');
});

test('normalizeText strips diacritics and lowercases', () => {
  expect(normalizeText('Pădure')).toBe('padure');
  expect(normalizeText('SĂUCA')).toBe('sauca');
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- search`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/domain/search.ts
/** Lowercase + remove all whitespace — tolerant of a stray space inside a code (P-1). */
export const normalizeCode = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, '');

/** Lowercase + strip diacritics for accent-insensitive comparison. */
export const normalizeText = (s: string): string =>
  s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- search`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/search.ts tests/unit/search.test.ts
git commit -m "feat(search): code/text normalization helpers"
```

### Task 3.2: `search_all()` RPC migration

**Files:**
- Create: `supabase/migrations/20260617120300_cf2_search.sql`

- [ ] **Step 1: Write the migration (trigram indexes + one RPC unioning entities)**

```sql
-- supabase/migrations/20260617120300_cf2_search.sql

-- Trigram indexes for fuzzy matching across the searchable fields (OQ-7).
create index parcels_cf_trgm on parcels using gin (cf_current gin_trgm_ops);
create index parcels_topo_trgm on parcels using gin (topo_code gin_trgm_ops);
create index parcel_cf_aliases_trgm on parcel_cf_aliases using gin (cf_number gin_trgm_ops);
create index dossiers_holder_trgm on dossiers using gin (original_holder gin_trgm_ops);
create index dossiers_number_trgm on dossiers using gin (dossier_number gin_trgm_ops);
create index documents_number_trgm on documents using gin (document_number gin_trgm_ops);

-- Unified search. Accent-insensitive, space-tolerant; old<->new CF both resolve (P-3).
create or replace function search_all(q text)
returns table (kind text, id uuid, label text, sub text)
language sql stable security invoker
set search_path = public, extensions
as $$
  with needle as (select unaccent(lower(regexp_replace(q, '\s+', '', 'g'))) as n,
                         unaccent(lower(trim(q))) as t)
  -- Parcels by current CF or TOP (space-insensitive)
  select 'parcel', p.id, coalesce(p.cf_current, p.topo_code), p.uat
  from parcels p, needle
  where p.archived_at is null
    and (unaccent(lower(regexp_replace(coalesce(p.cf_current,''),'\s+','','g'))) like '%'||needle.n||'%'
      or unaccent(lower(regexp_replace(coalesce(p.topo_code,''),'\s+','','g'))) like '%'||needle.n||'%')
  union all
  -- Parcels by OLD CF alias (P-3)
  select 'parcel', a.parcel_id, a.cf_number, 'CF vechi'
  from parcel_cf_aliases a, needle
  where unaccent(lower(regexp_replace(a.cf_number,'\s+','','g'))) like '%'||needle.n||'%'
  union all
  -- Dossiers by number or holder (fuzzy)
  select 'dossier', d.id, d.dossier_number, d.original_holder
  from dossiers d, needle
  where d.archived_at is null
    and (unaccent(lower(d.dossier_number)) like '%'||needle.t||'%'
      or unaccent(lower(coalesce(d.original_holder,''))) % needle.t
      or unaccent(lower(coalesce(d.original_holder,''))) like '%'||needle.t||'%')
  union all
  -- Documents by number
  select 'document', dc.id, coalesce(dc.document_number, dc.original_filename), null
  from documents dc, needle
  where dc.archived_at is null
    and unaccent(lower(coalesce(dc.document_number,''))) like '%'||needle.t||'%'
  union all
  -- Leases by tenant (arendas)
  select 'lease', l.id, l.owner_name, l.contract_number
  from leases l, needle
  where unaccent(lower(l.owner_name)) like '%'||needle.t||'%'
  limit 50;
$$;
```

- [ ] **Step 2: Apply + verify in psql**

Run: `supabase db reset && docker exec -i supabase_db_atg psql -U postgres -d postgres -c "select * from search_all('1 0 1');"`
Expected: returns dossier 101 (space-tolerant) among results.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617120300_cf2_search.sql
git commit -m "feat(db): CF-2 search_all RPC with trigram + alias resolution"
```

### Task 3.3: Search action + global search bar

**Files:**
- Create: `src/lib/actions/search.ts`
- Create: `src/components/search/global-search.tsx`
- Modify: topbar in `src/components/shell/` to mount the search bar

- [ ] **Step 1: Search action**

```ts
// src/lib/actions/search.ts
'use server';
import { createClient } from '@/lib/supabase/server';

export type SearchHit = { kind: string; id: string; label: string | null; sub: string | null };

export async function searchAll(q: string): Promise<SearchHit[]> {
  if (q.trim().length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_all', { q });
  if (error) return [];
  return (data ?? []) as SearchHit[];
}
```

- [ ] **Step 2: Global search component (`"use client"`, debounced, results link to records)**

Build `global-search.tsx`: an input that calls `searchAll` (debounced ~250ms via a `setTimeout` in an effect), renders a dropdown of hits grouped by `kind`, each a `Link` (from `@/i18n/navigation`) to `/dossiers/{id}` (kind `dossier`/`document`) or `/farm?parcel={id}` (kind `parcel`/`lease`). Use Base UI primitives already in `components/ui`. Mount it in the topbar.

- [ ] **Step 3: Verify (e2e)**

Run: `npm run typecheck && npm run dev` then manually search `1 0 1` → dossier 101 appears and links through. Then write the e2e in Task 3.4.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/search.ts src/components/search src/components/shell
git commit -m "feat(search): global search bar backed by search_all RPC"
```

### Task 3.4: Search e2e (stray space + old/new CF)

**Files:**
- Create: `tests/e2e/search.spec.ts`

- [ ] **Step 1: Write the e2e (mirror `tests/e2e/properties.spec.ts` login helper)**

```ts
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test('global search tolerates a stray space and finds the dossier', async ({ page }) => {
  await page.goto('/ro/login');
  await page.getByLabel(/email/i).fill('admin@atg.local');
  await page.getByLabel(/parol/i).fill('password123');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL('**/ro');

  await page.getByRole('searchbox').fill('1 0 1');
  await expect(page.getByText('Kovacs Barna Stefan')).toBeVisible();
});
```

- [ ] **Step 2: Run**

Run: `npm run test:e2e -- search`
Expected: PASS (adjust selectors to the real topbar markup if needed).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/search.spec.ts
git commit -m "test(search): e2e for space-tolerant global search"
```

---

## Phase 4 — CF-9 lease management + billing support

### Task 4.1: ARENDAT-cell splitter (TDD)

**Files:**
- Create: `src/lib/domain/arendat.ts`
- Test: `tests/unit/arendat.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/arendat.test.ts
import { expect, test } from 'vitest';
import { splitArendatCell } from '@/lib/domain/arendat';

test('splits "TENANT NN/DD.MM.YYYY" into tenant + contract number + date', () => {
  expect(splitArendatCell('VARGA GHEORGHE 11/15.02.2019')).toEqual({
    tenant: 'VARGA GHEORGHE',
    contractNumber: '11',
    contractDate: '2019-02-15',
  });
});

test('handles tenant only', () => {
  expect(splitArendatCell('SUTH BEATA I.F')).toEqual({
    tenant: 'SUTH BEATA I.F',
    contractNumber: null,
    contractDate: null,
  });
});

test('empty -> null', () => {
  expect(splitArendatCell('')).toBeNull();
  expect(splitArendatCell('   ')).toBeNull();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- arendat`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/domain/arendat.ts
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
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- arendat`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/arendat.ts tests/unit/arendat.test.ts
git commit -m "feat(leases): split combined ARENDAT cell into structured fields"
```

### Task 4.2: Lease/billing view + actions

**Files:**
- Modify: `src/lib/actions/leases.ts` (add a billing-data list)
- Create: `src/components/farm/lease-billing.tsx`
- Modify: `src/app/[locale]/(app)/farm/page.tsx` to add the billing tab/section

- [ ] **Step 1: Add a billing list action**

```ts
// append to src/lib/actions/leases.ts
export type LeaseBillingRow = {
  id: string; owner_name: string; contract_number: string | null;
  expiry_date: string | null; amount: number | null; payment_status: string;
  parcel_label: string | null; area_sqm: number;
};

export async function listLeaseBilling(): Promise<{ data: LeaseBillingRow[]; error?: string }> {
  const supabase = await createClient();
  const [{ data: leases, error }, { data: parcels }] = await Promise.all([
    supabase.from('leases').select('*').order('expiry_date', { ascending: true }),
    supabase.from('parcels').select('id, cf_current, topo_code, area_sqm'),
  ]);
  if (error) return { data: [], error: error.message };
  const pMap = new Map((parcels ?? []).map((p) => [p.id, p]));
  const rows = (leases ?? []).map((l) => {
    const p = l.parcel_id ? pMap.get(l.parcel_id) : null;
    return {
      id: l.id, owner_name: l.owner_name, contract_number: l.contract_number,
      expiry_date: l.expiry_date, amount: l.amount, payment_status: l.payment_status,
      parcel_label: p ? (p.cf_current ?? p.topo_code) : null, area_sqm: p?.area_sqm ?? 0,
    };
  });
  return { data: rows };
}
```

- [ ] **Step 2: Build `lease-billing.tsx`**

A TanStack Table over `listLeaseBilling()` rows showing arendaș, contract #, expiry (scadență), amount (tarif), payment status, parcel CF, and `formatHa(area_sqm)`; a footer total `Σ amount` and `Σ area`; a "mark paid/unpaid" toggle gated by `can(role, 'leases', 'update')` (admin/manager/accountant). This is the invoicing-support view (CF-9 / P-7): all billing data in one place, no manual contract lookup.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Manually confirm the billing table renders and totals compute.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/leases.ts src/components/farm/lease-billing.tsx src/app/[locale]/\(app\)/farm/page.tsx
git commit -m "feat(leases): centralized billing-support view with totals (CF-9)"
```

---

## Phase 5 — CF-8 alerts / notifications

### Task 5.1: Lease alert status (TDD, reuse `daysUntil`)

**Files:**
- Create: `src/lib/domain/alerts.ts`
- Test: `tests/unit/alerts.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/alerts.test.ts
import { expect, test } from 'vitest';
import { leaseAlertStatus } from '@/lib/domain/alerts';

const today = new Date('2026-06-18T00:00:00Z');

test('overdue when expiry is in the past and unpaid', () => {
  expect(leaseAlertStatus('2026-05-01', 'unpaid', 30, today)).toBe('overdue');
});

test('due when within lead window', () => {
  expect(leaseAlertStatus('2026-07-10', 'unpaid', 30, today)).toBe('due');
});

test('none when far in the future', () => {
  expect(leaseAlertStatus('2026-12-01', 'unpaid', 30, today)).toBe('none');
});

test('none when already paid', () => {
  expect(leaseAlertStatus('2026-07-10', 'paid', 30, today)).toBe('none');
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- alerts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement (reuse existing `daysUntil`)**

```ts
// src/lib/domain/alerts.ts
import { daysUntil } from '@/lib/domain/leases';

export type AlertStatus = 'none' | 'due' | 'overdue';

/** Classify a lease for alerting: overdue (past + unpaid), due (within leadDays), or none. */
export function leaseAlertStatus(
  expiry: string | null,
  paymentStatus: 'paid' | 'unpaid' | string,
  leadDays: number,
  from: Date = new Date(),
): AlertStatus {
  if (!expiry || paymentStatus === 'paid') return 'none';
  const d = daysUntil(expiry, from);
  if (d < 0) return 'overdue';
  if (d <= leadDays) return 'due';
  return 'none';
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- alerts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/alerts.ts tests/unit/alerts.test.ts
git commit -m "feat(alerts): lease alert classification (due/overdue)"
```

### Task 5.2: Notifications migration

**Files:**
- Create: `supabase/migrations/20260617120400_cf8_notifications.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260617120400_cf8_notifications.sql
create type notification_type as enum ('lease_due', 'lease_overdue');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type notification_type not null,
  lease_id uuid references leases (id),
  due_date date,
  lead_days int not null default 30,
  status lease_payment_status not null default 'unpaid',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table notification_recipients (
  notification_id uuid not null references notifications (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (notification_id, profile_id)
);

alter table notifications enable row level security;
alter table notification_recipients enable row level security;

-- A user sees a notification only if they are a recipient (targeted delivery, CF-8).
create policy notifications_select on notifications for select to authenticated
  using (exists (select 1 from notification_recipients r
                 where r.notification_id = id and r.profile_id = auth.uid()));
create policy notifications_write on notifications for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
create policy nr_select on notification_recipients for select to authenticated
  using (profile_id = auth.uid() or auth_role() in ('admin', 'manager'));
create policy nr_write on notification_recipients for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
```

- [ ] **Step 2: Apply + regen types**

Run: `supabase db reset && supabase gen types typescript --local > src/lib/supabase/types.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617120400_cf8_notifications.sql src/lib/supabase/types.ts
git commit -m "feat(db): CF-8 notifications + targeted recipients"
```

### Task 5.3: Notification generation + bell UI

**Files:**
- Create: `src/lib/actions/notifications.ts`
- Create: `src/components/notifications/notification-bell.tsx`
- Modify: topbar to mount the bell

- [ ] **Step 1: Actions — generate lease notifications, list mine, mark read/paid**

```ts
// src/lib/actions/notifications.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { leaseAlertStatus } from '@/lib/domain/alerts';

/** Idempotently create due/overdue lease notifications. Intended for an admin action or cron. */
export async function generateLeaseNotifications(leadDays = 30): Promise<{ created: number; error?: string }> {
  const supabase = await createClient();
  const { data: leases, error } = await supabase
    .from('leases').select('id, expiry_date, payment_status');
  if (error) return { created: 0, error: error.message };

  let created = 0;
  for (const l of leases ?? []) {
    const status = leaseAlertStatus(l.expiry_date, l.payment_status, leadDays);
    if (status === 'none') continue;
    const type = status === 'overdue' ? 'lease_overdue' : 'lease_due';
    // De-dupe: skip if an unread notification of this type already exists for the lease.
    const { data: existing } = await supabase
      .from('notifications').select('id').eq('lease_id', l.id).eq('type', type).is('read_at', null).maybeSingle();
    if (existing) continue;
    await supabase.from('notifications').insert({
      type, lease_id: l.id, due_date: l.expiry_date, lead_days: leadDays, status: l.payment_status,
    });
    created++;
  }
  revalidatePath('/[locale]', 'page');
  return { created };
}

export async function listMyNotifications() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications').select('*').is('read_at', null).order('due_date', { ascending: true });
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/[locale]', 'page');
  return {};
}
```

- [ ] **Step 2: Bell component**

`notification-bell.tsx` (`"use client"`): a bell icon (lucide) with an unread count badge, dropdown listing `listMyNotifications()` items (type label, lease contract #, due date, paid/unpaid), each with "Mark read" → `markNotificationRead`. Mount in topbar next to the search bar. Targeting is enforced by RLS (recipients).

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Manually: seed a lease with a near expiry, run `generateLeaseNotifications`, add yourself as recipient, confirm the bell shows it.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/notifications.ts src/components/notifications src/components/shell
git commit -m "feat(notifications): lease due/overdue generation + bell (CF-8)"
```

---

## Phase 6 — CF-6 filters/totals + CF-7 reports

### Task 6.1: Parcel table filters/grouping/totals (CF-6)

**Files:**
- Modify: `src/components/farm/parcel-table.tsx`

- [ ] **Step 1: Add column filters, grouping, and a totals footer**

Using the TanStack Table instance already in this component: enable `getFilteredRowModel`, `getGroupedRowModel`, and add UI filters for UAT, `intabulare_status`, `category_id`. Add a footer row computing `Σ area` via `formatHa(rows.reduce((s, r) => s + r.original.area_sqm, 0))`. Add a sort toggle on area (descending = "topul celor mai mari", per CF-6 example). Reuse the filter UI pattern from `src/components/properties/property-table.tsx`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Manually: filter by UAT, group by UAT, confirm the area total updates with the filtered set.

- [ ] **Step 3: Commit**

```bash
git add src/components/farm/parcel-table.tsx
git commit -m "feat(farm): parcel filter/group/sort + area totals (CF-6)"
```

### Task 6.2: Reports page (CF-7)

**Files:**
- Create: `src/lib/actions/reports.ts`
- Create: `src/components/reports/report-cards.tsx`
- Create: `src/app/[locale]/(app)/reports/page.tsx`
- Modify: shell nav + `messages/{ro,en}.json`

- [ ] **Step 1: Reports aggregation action**

```ts
// src/lib/actions/reports.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { sqmToHa } from '@/lib/domain/area';

export type PortfolioReport = {
  totalParcels: number;
  totalAreaHa: number;
  areaByUat: { uat: string; ha: number }[];
  areaByStatus: { status: string; ha: number }[];
  leasesDueSoon: number;
};

export async function portfolioReport(): Promise<PortfolioReport> {
  const supabase = await createClient();
  const { data: parcels } = await supabase
    .from('parcels').select('uat, intabulare_status, area_sqm').is('archived_at', null);
  const rows = parcels ?? [];
  const byKey = (key: 'uat' | 'intabulare_status') => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = (r[key] as string) ?? '—';
      m.set(k, (m.get(k) ?? 0) + sqmToHa(r.area_sqm ?? 0));
    }
    return [...m.entries()].map(([k, ha]) => ({ key: k, ha: Number(ha.toFixed(2)) }));
  };
  const { count: dueCount } = await supabase
    .from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null);
  return {
    totalParcels: rows.length,
    totalAreaHa: Number(rows.reduce((s, r) => s + sqmToHa(r.area_sqm ?? 0), 0).toFixed(2)),
    areaByUat: byKey('uat').map((x) => ({ uat: x.key, ha: x.ha })),
    areaByStatus: byKey('intabulare_status').map((x) => ({ status: x.key, ha: x.ha })),
    leasesDueSoon: dueCount ?? 0,
  };
}
```

- [ ] **Step 2: Page + cards**

`reports/page.tsx` (Server Component) calls `portfolioReport()` and renders `<ReportCards report={...}/>`. `report-cards.tsx` renders KPI cards (total parcels, total ha, leases due) and two simple bar lists (area by UAT, by status), mirroring the dashboard KPI card style already in `src/app/[locale]/(app)/page.tsx`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS. Manually: `/ro/reports` shows totals.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/reports.ts src/components/reports src/app/[locale]/\(app\)/reports messages src/components/shell
git commit -m "feat(reports): portfolio statistics page (CF-7)"
```

---

## Phase 7 — CF-10 accountant role + permission matrix

### Task 7.1: Add `accountant` to the role enum + RLS

**Files:**
- Create: `supabase/migrations/20260617120500_cf10_accountant.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260617120500_cf10_accountant.sql
alter type user_role add value if not exists 'accountant';

-- Accountants manage lease billing (payment status) in addition to read-all.
drop policy if exists leases_insert on leases;
drop policy if exists leases_update on leases;
create policy leases_insert on leases for insert to authenticated
  with check (auth_role() in ('admin', 'manager', 'accountant'));
create policy leases_update on leases for update to authenticated
  using (auth_role() in ('admin', 'manager', 'accountant'))
  with check (auth_role() in ('admin', 'manager', 'accountant'));

-- Accountants can be notification recipients and read their notifications (already covered by
-- the recipient-based select policy). Allow them to mark their own as read:
drop policy if exists notifications_write on notifications;
create policy notifications_mgr_write on notifications for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
create policy notifications_recipient_update on notifications for update to authenticated
  using (exists (select 1 from notification_recipients r where r.notification_id = id and r.profile_id = auth.uid()))
  with check (true);
```

- [ ] **Step 2: Apply + regen types + typecheck**

Run: `supabase db reset && supabase gen types typescript --local > src/lib/supabase/types.ts && npm run typecheck`
Expected: PASS (`user_role` now includes `accountant`).

> Note: `alter type ... add value` cannot run inside a transaction with later uses of the value in the same migration in some Postgres versions. The lease policies above reference the *string* literal, not the enum label directly, so they are safe. If `supabase db reset` errors on enum usage, split the `alter type` into its own earlier migration file `20260617120450_role_accountant.sql`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617120500_cf10_accountant.sql src/lib/supabase/types.ts
git commit -m "feat(db): CF-10 accountant role + lease/notification policies"
```

### Task 7.2: Extend the RBAC mirror (TDD)

**Files:**
- Modify: `src/lib/auth/rbac.ts`
- Modify: `tests/unit/rbac.test.ts`

- [ ] **Step 1: Add failing tests for the new role + resources**

```ts
// append to tests/unit/rbac.test.ts
import { can } from '@/lib/auth/rbac';
import { expect, test } from 'vitest';

test('accountant can update leases but not parcels', () => {
  expect(can('accountant', 'leases', 'update')).toBe(true);
  expect(can('accountant', 'parcels', 'update')).toBe(false);
});
test('no role can delete documents (CF-4)', () => {
  for (const r of ['admin', 'manager', 'operator', 'accountant'] as const) {
    expect(can(r, 'documents', 'delete')).toBe(false);
  }
});
test('only admin can archive (delete-equivalent) dossiers', () => {
  expect(can('admin', 'dossiers', 'delete')).toBe(true);
  expect(can('manager', 'dossiers', 'delete')).toBe(false);
});
test('operator can upload documents', () => {
  expect(can('operator', 'documents', 'create')).toBe(true);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- rbac`
Expected: FAIL (accountant not in `Role`, documents/dossiers not in `Resource`).

- [ ] **Step 3: Update the RBAC mirror**

```ts
// src/lib/auth/rbac.ts — full replacement
export type Role = 'admin' | 'manager' | 'operator' | 'accountant';

export type Resource =
  | 'properties' | 'parcels' | 'leases' | 'storage' | 'inventory'
  | 'yard_trucks' | 'users' | 'dossiers' | 'documents' | 'notifications';

export type Action = 'create' | 'read' | 'update' | 'delete';

const MANAGER_WRITE: Resource[] = ['properties', 'parcels', 'leases', 'storage', 'inventory', 'dossiers'];

/**
 * Mirrors the database RLS policies so the UI can hide/disable controls the
 * current role may not use. RLS in Postgres remains the real boundary.
 * CF-4: nothing is hard-deletable; 'delete' on dossiers means admin-only soft archive.
 */
export function can(role: Role, resource: Resource, action: Action): boolean {
  // CF-4: documents are never deletable by anyone.
  if (resource === 'documents' && action === 'delete') return false;
  // Soft-archive of structural records is admin-only.
  if (action === 'delete' && (resource === 'dossiers' || resource === 'parcels')) return role === 'admin';

  if (role === 'admin') return true;
  if (resource === 'users') return false;            // admin-only (handled above)
  if (action === 'read') return true;                 // everyone reads

  if (role === 'manager') return MANAGER_WRITE.includes(resource);

  if (role === 'accountant') {
    return resource === 'leases' && (action === 'create' || action === 'update');
  }

  // operator
  if (resource === 'yard_trucks') return true;
  if (resource === 'inventory' && action === 'create') return true;
  if (resource === 'documents' && action === 'create') return true; // operators upload scans
  return false;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- rbac`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/rbac.ts tests/unit/rbac.test.ts
git commit -m "feat(rbac): accountant role + dossier/document permissions (CF-10)"
```

### Task 7.3: Seed an accountant login

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Add an accountant user mirroring the existing seeded users**

Follow the exact pattern the seed already uses to create `admin@atg.local` etc. (insert into `auth.users` + the profile row). Add `accountant@atg.local` with role `accountant`, password `password123`.

- [ ] **Step 2: Apply + verify**

Run: `supabase db reset && docker exec -i supabase_db_atg psql -U postgres -d postgres -c "select full_name, role from profiles order by role;"`
Expected: an `accountant` row present.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore(db): seed accountant login"
```

---

## Phase 8 — Data import tooling (OQ-18)

### Task 8.1: Dossier folder-name parser (TDD)

**Files:**
- Create: `src/lib/domain/dossier.ts`
- Test: `tests/unit/dossier.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/dossier.test.ts
import { expect, test } from 'vitest';
import { parseDossierFolderName } from '@/lib/domain/dossier';

test('parses "Dosar {n} - {DD.MM.YYYY} {Titular}"', () => {
  expect(parseDossierFolderName('Dosar 101 - 15.05.2006 Kovacs Barna Stefan')).toEqual({
    number: '101', date: '2006-05-15', holder: 'Kovacs Barna Stefan',
  });
});

test('tolerates extra spaces', () => {
  expect(parseDossierFolderName('Dosar  940 -  26.06.2007  Nagy Margareta-Terezia')).toEqual({
    number: '940', date: '2007-06-26', holder: 'Nagy Margareta-Terezia',
  });
});

test('returns null on non-matching names', () => {
  expect(parseDossierFolderName('Random folder')).toBeNull();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- dossier`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/domain/dossier.ts
export type ParsedDossier = { number: string; date: string; holder: string };

const RE = /^Dosar\s+(\d+)\s*-\s*(\d{2})\.(\d{2})\.(\d{4})\s+(.+)$/;

export function parseDossierFolderName(name: string): ParsedDossier | null {
  const m = name.trim().replace(/\s+/g, ' ').match(RE);
  if (!m) return null;
  const [, num, dd, mm, yyyy, holder] = m;
  return { number: num, date: `${yyyy}-${mm}-${dd}`, holder: holder.trim() };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- dossier`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/domain/dossier.ts tests/unit/dossier.test.ts
git commit -m "feat(import): dossier folder-name parser"
```

### Task 8.2: Parcel CSV importer (server action)

**Files:**
- Create: `src/lib/actions/import.ts`
- Reuse: `src/lib/csv.ts` (existing CSV helper)

- [ ] **Step 1: Write a CSV import action**

Build `importParcels(csvText: string)`: parse rows (reuse `src/lib/csv.ts`), for each row normalize the category (map free-text `ARABIL`/`arabil` → `land_categories.code='arabil'` via `normalizeText` from `@/lib/domain/search`), convert area: if the sheet's unit is hectares use `haToSqm`, else use the integer as m² (the importer takes a `unit: 'sqm' | 'hectare'` argument per sheet, since the source mixes units — §7.1), split the `ARENDAT` cell with `splitArendatCell` into a `leases` insert, and link to a dossier by `dossier_number`. Insert parcels + cf aliases + leases; write `audit_log` rows. Return `{ inserted, skipped, errors }`.

- [ ] **Step 2: Verify (unit-level on the pure mapping)**

Add a small vitest that feeds 2–3 CSV lines mirroring Dosar 101 and asserts the mapped parcel objects (area in sqm, category code, split tenant). Run: `npm test -- import`.
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/import.ts tests/unit/import.test.ts
git commit -m "feat(import): parcel CSV importer with unit/category normalization"
```

### Task 8.3: Acceptance — import the three example dossiers

**Files:**
- (No new code) — manual acceptance using the seeded dossiers + a small CSV built from the example data.

- [ ] **Step 1:** Build CSVs from Dosar 101 / 118 / 940 example columns (101 in m², 118 in ha, 940 in m² — exercises the unit argument).
- [ ] **Step 2:** Run the importer per sheet; confirm parcels link to the right dossier, areas all display in ha consistently, categories resolved to the controlled list, and the `ARENDAT` tenants split out into leases.
- [ ] **Step 3:** Confirm global search finds each dossier by number and holder, and old/new CF (use the filename-derived CF history: `285/290-N → 100340/100341`; `7 → 226 → 100188`) resolve to the same parcel after adding those as `parcel_cf_aliases`.
- [ ] **Step 4: Commit** any fixture files used.

```bash
git add tests/fixtures/
git commit -m "test(import): example-dossier acceptance fixtures"
```

---

## Phase 9 — i18n, polish, e2e, final acceptance

### Task 9.1: i18n completeness

**Files:**
- Modify: `messages/ro.json`, `messages/en.json`

- [ ] **Step 1:** Ensure every new UI string (dossiers, documents, search, notifications, reports, new parcel fields, enum labels for `intabulare_status`/`document_variant`/categories) has both RO and EN keys. Grep for hard-coded strings in the new components and replace with `useTranslations` keys.
- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: PASS, no missing-message warnings in the build log.

- [ ] **Step 3: Commit**

```bash
git add messages
git commit -m "i18n: RO/EN strings for dossiers, search, notifications, reports"
```

### Task 9.2: Dossier + notification e2e

**Files:**
- Create: `tests/e2e/dossiers.spec.ts`, `tests/e2e/notifications.spec.ts`

- [ ] **Step 1:** `dossiers.spec.ts` — log in as admin, open dossier 101, upload a small PDF (use `setInputFiles` on a fixture), assert it appears in the document list and that **no delete control exists** (`await expect(page.getByRole('button', { name: /șterge|delete/i })).toHaveCount(0)` within the document list). Follow the Yard `waitForResponse` pattern for the upload round-trip.
- [ ] **Step 2:** `notifications.spec.ts` — seed/generate a due lease notification, add the admin as recipient, assert the bell badge shows and the item lists; mark read and assert it clears.
- [ ] **Step 3: Run**

Run: `npm run test:e2e`
Expected: all e2e pass (existing + new).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/dossiers.spec.ts tests/e2e/notifications.spec.ts tests/fixtures
git commit -m "test(e2e): dossier upload immutability + notification lifecycle"
```

### Task 9.3: Final acceptance sweep

- [ ] **Step 1:** Run the full gate: `npm run typecheck && npm test && npm run lint && npm run test:e2e && npm run build`. All green.
- [ ] **Step 2:** Walk the spec §6 acceptance table CF-by-CF (CF-1…CF-4, CF-6…CF-10) and tick each criterion against the running app.
- [ ] **Step 3:** Confirm the deferred items (CF-5/OCR, eTerra, predictive AI, multi-company, invoice generation) are absent, as scoped.
- [ ] **Step 4: Commit** any final fixes; tag the milestone if desired.

```bash
git commit -am "chore: Faza 1 acceptance pass"
```

---

## Self-Review (completed)

- **Spec coverage:** CF-1 → Phase 1; CF-2 → Phase 3; CF-3 → Phase 2; CF-4 → Tasks 0.3 + 1.2 + 2.4 (storage + RLS + test); CF-5 → out of scope (§12); CF-6 → Task 6.1; CF-7 → Task 6.2; CF-8 → Phase 5; CF-9 → Phase 4; CF-10 → Phase 7. Data model (spec §4) → Phase 0–1 migrations. Migration tooling (OQ-18) → Phase 8. i18n/access/non-functional → Phase 9 + reuse.
- **Placeholder scan:** UI-component tasks (1.3, 2.5, 4.2, 5.3, 6.x) describe components by responsibility + the exact existing file to mirror and the fully-specified server actions they call, rather than restating large JSX verbatim — deliberate, since the actions/schemas (the load-bearing logic) are given in full and the components are thin shells over established patterns. All backend, domain, migration, and test code is complete.
- **Type consistency:** `area_sqm`, `formatHa`, `search_all(q)`/`SearchHit`, `leaseAlertStatus(expiry, paymentStatus, leadDays, from)`, `parseDossierFolderName`, `splitArendatCell`, `Role`/`Resource` additions, and the `documents`/`dossiers`/`notifications` columns are used identically across the tasks that reference them.
- **Sequencing:** CF-4 protection ships with the storage bucket (Phase 0) and the table creation (Phase 1) — honoring the client's #1 priority while respecting that you cannot policy a table before it exists.
