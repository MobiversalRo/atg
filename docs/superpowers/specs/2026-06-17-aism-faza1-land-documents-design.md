# AISM / Ameropa — Faza 1: Land & Document Management — Design Spec

- **Date:** 2026-06-17
- **Beneficiary:** SC AGISM S.R.L. ("AISM", part of the Ameropa group · contacts: Cosmin, Sebastian) · **Builder:** ATG Investopia S.R.L.
- **Status:** Approved design — basis for the implementation plan
- **Sources:** `AISM_Ameropa_Faza1_Specificatie_Functionala` v0.2 (functional requirements, CF-1…CF-10, OQ-1…OQ-24); the existing MVP design `2026-06-08-erp-hibrid-atg-design.md`; the live `atg` codebase + Supabase schema.
- **Relationship to the MVP:** This spec **extends** the existing `atg` ERP for the same client. Auth, RBAC, RLS patterns, app shell, bilingual RO/EN, and Supabase are reused. The Yard and SiloBoard modules are left in place untouched (silos remain out of *this* spec's scope but the existing module stays).

---

## 1. Objective & scope

Add the document-centric pillars the MVP lacks, and upgrade the parcel/lease model to match the client's real data (the Excel model + three acquisition folders). The goal is a single source of truth for both **scanned documents** and the **structured parcel/lease data** currently scattered across per-UAT Excel files and network folders, with instant search, immutability of documents, and lease alerts.

**In scope (Faza 1):** CF-1 centralization + links · CF-2 instant search · CF-3 upload + change history · CF-4 deletion protection · CF-6 filter/sort/group/totals · CF-7 reports · CF-8 alerts · CF-9 lease management + billing support · CF-10 users/roles/permissions.

**Explicitly deferred:** CF-5 (OCR / AI extraction) — the example set is 30/31 image-only scans; deferred to a later phase per client decision. See §12.

## 2. Decisions (locked)

- **Extend the existing MVP** (do not rebuild). Reuse auth, RLS, shell, i18n, Supabase, TanStack Table, the Server-Components-read / Server-Actions-write pattern.
- **OCR deferred.** Faza 1 ships document upload + manual/structured data entry. Originals are stored unmodified so OCR can be layered on later without re-ingestion.
- **Documented defaults** resolve the 24 open questions with pragmatic, reversible engineering decisions (§3). They are assumptions for client confirmation, not blockers.
- **Roles:** Admin · Manager · Operator · **Accountant** (new). RBAC enforced by RLS. See §8.
- **One full implementation plan** covering CF-1…CF-10, sequenced CF-4 first (client's #1 priority).
- **Search backend:** PostgreSQL `pg_trgm` + `unaccent` (no external search service) — honors the "simpluț" non-functional requirement.
- **Area canonical unit:** store **m²**, display **ha**.

## 3. Documented defaults for the open questions (reversible — for client confirmation)

| OQ | Decision |
|----|----------|
| OQ-1 | `intabulare_status` controlled list = {`intabulat`, `intabulat_cu_posesie`, `posesie`}. "AISM POSESOR" maps to `posesie`. |
| OQ-22 | **Land category is a separate field from status** — "Padure intabulat" decomposes into category=*Pădure* + status=*Intabulat*. Category (`land_categories`) and document type (`document_types`) are admin-editable nomenclators; category seeded {Arabil, Pădure}. Free-text values like `ARABIL`/`arabil` are normalized into the controlled list at import. |
| OQ-5 | The §4 union schema is treated as authoritative; an `observatii` free-text field absorbs anything unmapped. Example folders assumed representative pending client confirmation. |
| OQ-6 | **No eTerra integration.** Old CF numbers are entered/stored manually (`parcel_cf_aliases`). |
| OQ-7 | Searchable fields: CF current, CF old, titular, UAT, Nr. TOP, dossier #, contract #, document type/#, arendaș. **Document text/OCR is not searchable** (OCR deferred). |
| OQ-8 | Change history = **audit log (who / when / what)**. Documents are immutable (no replace), so no file-version recovery is needed. Supported uploads: PDF, images (jpg/png/tiff), office docs. |
| OQ-9 / CF-4 | **No hard delete for anyone.** Admin-only soft *archive/hide* for mistakenly added documents; the original blob is never removed. Structural records (parcels/dossiers) also archive rather than delete. |
| OQ-10 | OCR deferred (see §12). |
| OQ-11 | Filter/sort/group/totals — parcels: filter by UAT/status/category/arendat/ipotecat, group by UAT/category, total = Σ area; leases: filter by arendaș/expiry/payment status, total = Σ amount and Σ leased area. |
| OQ-12 | Reports: total area by UAT / status / category; parcel & dossier counts; leases due/overdue; top leases by area. Extensible. |
| OQ-13 | Notifications **in-app** (email behind a config flag, off by default). Events: lease scadență (paid/unpaid) with configurable days-before and targeted recipients. Predictive AI excluded. |
| OQ-14 | Platform **displays** billing data (invoicing *support*); does **not** generate invoices in Faza 1. Payment status tracked manually. Lease fields: arendaș, suprafață, tarif/preț, scadență, payment status. |
| OQ-15 | Four roles (§8) with a defined permission matrix. |
| OQ-16 | Web-first responsive (works in a mobile browser; no native app). |
| OQ-17 | Bilingual RO/EN, **RO default** (already built). |
| OQ-18 | Importers: Excel/CSV → parcels (union schema); bulk document import by the `Dosar {n} - {DD.MM.YYYY} {Titular}` folder convention. |
| OQ-19 | Acceptance = every in-scope CF's acceptance criteria pass + the three example dossiers import cleanly. |
| OQ-20 | Priority order: CF-4 → CF-1 → CF-3 → CF-2 → CF-9 → CF-8 → CF-6/CF-7 → CF-10. |
| OQ-21 | Store **m²** canonical, display **ha**; migrate existing `parcels.area_ha` → `area_sqm`. |
| OQ-23 | `dossier_number` is the unique business key; **a dossier maps to many parcels** (e.g. Dosar 118 → 3+). |
| OQ-24 | Document taxonomy (§4) is an admin-editable controlled list; `variant` (original/copie/timbrat/legalizat) is a separate tracked field. |

## 4. Data model

Reuses existing enums (`property_*`, `currency`, `area_unit`, `lease_payment_*`, `yard_*`, `stock_txn_type`). Changes below.

**New / changed enums**

- `user_role` → add `accountant` → `(admin | manager | operator | accountant)`.
- `intabulare_status` (new) → `(intabulat | intabulat_cu_posesie | posesie)`.
- `document_variant` (new) → `(original | copie | timbrat | legalizat)`.
- `notification_type` (new) → `(lease_due | lease_overdue)` (extensible).

**New tables**

| Table | Key columns | Notes |
|---|---|---|
| `dossiers` | `dossier_number (unique)`, `acquisition_date`, `original_holder`, `intabulare_status`, `archived_at?`, `archived_by?` | Dosar de dobândire; 1 → many parcels. |
| `documents` | `dossier_id (FK)?`, `parcel_id (FK)?`, `document_type_id (FK)`, `variant (document_variant)?`, `document_number?`, `document_date?`, `storage_path`, `original_filename`, `mime_type`, `uploaded_by (FK profiles)`, `archived_at?`, `archived_by?` | **Immutable original** (CF-4); no delete policy. |
| `parcel_cf_aliases` | `parcel_id (FK)`, `cf_number` | Old/prior CF numbers; powers CF-old↔new search. |
| `land_categories` | `code (unique)`, `name`, `name_en` | Nomenclator; seed {Arabil, Pădure}. |
| `document_types` | `code (unique)`, `name`, `name_en` | Nomenclator; seed from §4 taxonomy. |
| `audit_log` | `entity`, `entity_id`, `action`, `actor (FK profiles)`, `at`, `diff (jsonb)?` | CF-3 "who changed what/when". |
| `notifications` | `type (notification_type)`, `lease_id (FK)?`, `due_date`, `lead_days`, `status (paid/unpaid)`, `read_at?`, `created_at` | CF-8. |
| `notification_recipients` | `notification_id (FK)`, `profile_id (FK)` | Targeted delivery (CF-8). |

**Extended tables**

| Table | Added columns |
|---|---|
| `parcels` | `uat`, `cf_current`, `tp` (titlu de proprietate), `area_sqm` (canonical; replaces `area_ha` after migration), `category_id (FK land_categories)?`, `intabulare_status?`, `ipotecat_holder?`, `vanzator?`, `dossier_id (FK dossiers)?`, `archived_at?`, `archived_by?`. Existing `topo_code` = Nr. TOP; `notes` = OBSERVATII. |
| `leases` | Confirm `owner_name` semantics as **arendaș (tenant)**; `amount` = tarif/preț; `expiry_date` = scadență; reuse `payment_status`. Add billing-support view (no schema change beyond clarity comments). |

**Document taxonomy (seed for `document_types`):** Antecontract de vânzare-cumpărare · Contract de vânzare-cumpărare (CVC) · Titlu de proprietate (TP) · Extras / Carte funciară (CF) · Documente cadastrale (A/P/F, memoriu, schiță) · Acte de identificare personală (CI/BI/CN/CD) · Documente de succesiune / testament · Declarație olografă.

**DB behavior:** `updated_at` triggers on mutable tables (existing pattern); `audit_log` written on document/record mutations via server actions; area stored in m².

## 5. Cross-cutting pillars

- **CF-4 deletion protection (built first).** The existing RLS migration grants `delete` to admin/manager on every domain table via a loop. Override this: `documents`, `dossiers`, and `parcels` are **excluded from the delete-granting loop** and receive explicit policies with **no delete** for any role (per the OQ-9 default that extends no-delete to structural records, not just files). The Supabase Storage bucket `documents` is private with **no delete** for any role. Admin-only `archive` (soft, sets `archived_at/by`). This is a DB + storage invariant, not a UI nicety.
- **CF-2 instant search.** `pg_trgm` + `unaccent`, GIN trigram indexes, a single `search(query)` RPC unioning parcels / dossiers / documents / leases. Trigram similarity tolerates a stray space in a code (P-1); `parcel_cf_aliases` makes old↔new CF resolve to the same parcel (P-3). Results link straight to the record.
- **CF-1 links.** UUID keys throughout (existing); parcel ↔ dossier ↔ documents ↔ lease are navigable in both directions. One shared record — no private copies (P-5).
- **CF-3 audit.** `audit_log` records who modified which document/record and when.

## 6. Functional requirements → how addressed

| CF | Addressed by | Key acceptance |
|---|---|---|
| CF-1 | §4 schema + links; nomenclators unify inconsistent Excel columns/units | A parcel carries its structured data and links to its dossier, documents, lease; each has a unique id. |
| CF-2 | `pg_trgm`/`unaccent` search RPC + topbar search bar + CF aliases | Fuzzy search finds the record despite a stray space; old or new CF returns the same parcel. |
| CF-3 | Upload to Storage + `audit_log` | Upload attaches a file to a record; history shows who changed a document. |
| CF-4 | No-delete RLS + immutable storage + admin-only archive | No user action hard-deletes a document; accidental loss impossible in normal use. |
| CF-6 | TanStack Table filter/sort/group + Σ totals | Filter/sort/group records; totals over a set (e.g. Σ area). |
| CF-7 | Reports page (§3 OQ-12 set) | Portfolio statistics rendered. |
| CF-8 | `notifications` + bell + configurable lead days + recipients | Lease-due alert N days ahead; mark paid/unpaid; sent to specific people. |
| CF-9 | Central lease list + billing-support view | Lease (who/what/terms) visible to all authorized; billing data shown so invoicing isn't manual lookup. |
| CF-10 | 4-role RBAC + permission matrix (§8) | Admin sees/does all; other roles restricted; enforced by RLS. |

## 7. UI (additions to the existing shell)

- **Topbar:** global **search bar** (CF-2); **notifications bell** (CF-8).
- **New nav — Dosare:** dossier list + dossier detail (metadata, linked parcels, document list with type/variant/number/date, upload control).
- **New nav — Rapoarte:** CF-7 aggregates.
- **Extend Farm/Parcels:** richer parcel fields; filter/sort/group/totals (CF-6); a **lease / billing** tab (CF-9).
- All new UI bilingual RO/EN via `next-intl`; enum/nomenclator values mapped to localized labels.

## 8. RBAC permission matrix (4 roles)

| Capability | Admin | Manager | Operator | Accountant |
|---|---|---|---|---|
| Read all data | ✓ | ✓ | ✓ | ✓ |
| Create/edit parcels, dossiers | ✓ | ✓ | — | — |
| Upload documents | ✓ | ✓ | ✓ | — |
| Archive document/record (soft) | ✓ | — | — | — |
| Hard delete | — | — | — | — |
| Manage leases / payment status (billing) | ✓ | ✓ | — | ✓ |
| Receive lease/billing notifications | ✓ | ✓ | — | ✓ |
| Manage users & roles, nomenclators | ✓ | — | — | — |

Implemented by extending `user_role`, the `auth_role()` helper usage, and the RLS policy loops (operator/manager arrays + new accountant-specific policies on `leases`/`notifications`).

## 9. Data migration / import (OQ-18)

- **Parcels importer:** Excel/CSV → union schema; normalizes units to m², maps free-text category/status into controlled lists, splits the `ARENDAT` cell (arendaș vs contract #/date) into structured lease fields.
- **Document importer:** bulk upload from a dossier folder; parses the `Dosar {n} - {DD.MM.YYYY} {Titular}` convention to create/attach the dossier; infers document type from filename where possible (user-reviewable).
- The three example dossiers (101, 118, 940) are the migration acceptance fixtures.

## 10. Non-functional

Simple single platform ("simpluț"); fast/forgiving search vs. Windows search; single shared source of truth (no divergent copies); documents durable & never lost; auditability of document changes; web-first responsive; bilingual RO/EN; scale ~4 active users, thousands of parcels (~2,300 ha here, ~4,000+ ha total, ~2 ha/parcel).

## 11. Sequencing / work packages (CF-4 first)

0. **Foundation** — Storage bucket `documents`; `audit_log`; nomenclators (`land_categories`, `document_types`); `pg_trgm`/`unaccent`; area-unit migration (`area_ha` → `area_sqm`) incl. existing Farm code/tests.
1. **CF-4** — Deletion protection (RLS override + storage policy + admin archive).
2. **CF-1** — Schema: extend `parcels`, add `dossiers`/`documents`/`parcel_cf_aliases`; links; lease reconciliation. Regenerate Supabase types.
3. **CF-3** — Upload + audit.
4. **CF-2** — Instant search (RPC + topbar UI).
5. **CF-9** — Lease management + billing-support view.
6. **CF-8** — Alerts/notifications (bell, lead days, recipients, paid/unpaid).
7. **CF-6 + CF-7** — Filter/sort/group/totals + reports.
8. **CF-10** — Accountant role + permission matrix.
9. **Import tooling** — Parcels + documents importers; example-dossier acceptance.
10. **i18n / polish / e2e / acceptance.**

## 12. Out of scope (Faza 1)

OCR / AI data extraction (CF-5) · eTerra integration · predictive/anticipatory AI alerts · multi-company (per-society) access · invoice generation · native mobile app. (Silos/SiloBoard remain out of this spec; the existing module is left in place.)

## 13. Testing

- **Vitest (pure domain):** search normalization (space-tolerance, unaccent), m²↔ha conversion, lease/alert date logic, dossier folder-name parser, ARENDAT-cell splitter.
- **Playwright e2e:** upload-then-immutability (no delete affordance), global search (stray space + old/new CF), alert lifecycle (paid/unpaid), RBAC per role. Follow the Yard `useOptimistic` + `waitForResponse` pattern.

## 14. Remaining for client confirmation

All §3 defaults are reversible and should be confirmed. The highest-impact confirmations: OQ-1/OQ-22 (status & category lists), OQ-21 (area unit), OQ-9 (archive vs. absolute no-delete), OQ-13/OQ-14 (notification channel & invoicing boundary), OQ-15 (role matrix incl. accountant), OQ-18 (migration approach), and OQ-5 (whether the three example dossiers are representative of all UATs).
