# ERP Hibrid ATG/Investopia — Design Spec (MVP)

- **Date:** 2026-06-08
- **Beneficiary:** SC AGISM S.R.L. · **Builder:** ATG Investopia S.R.L.
- **Status:** Approved design — basis for the implementation plan
- **Sources:** "Brief de Specificații Tehnice și Funcționale" (business brief) + "PRD/SRS Hybrid ERP MVP" (technical spec)

## 1. Objective

A secure, responsive web app that replaces fragmented Excel-based management of real-estate and
agribusiness assets with a single, visual, easy-to-use database. Scope is the MVP: Auth + three
operational modules + a KPI dashboard.

## 2. Decisions (locked)

- **Backend:** Supabase — PostgreSQL + Auth + Row-Level Security + Storage.
- **Roles:** Admin · Manager · Operator (RBAC enforced by RLS).
- **Language:** Bilingual RO/EN via `next-intl`, **RO default**, switcher in the top bar.
- **Data access (A):** Hybrid — Server Components for reads, Server Actions for mutations,
  `"use client"` only for interactive UI (Kanban DnD, forms, charts). RLS is the security boundary.
- **Inventory truth (B):** Append-only `stock_transactions` ledger + DB-trigger-maintained
  `current_load_ton` (audit trail + fast SiloBoard reads).
- **i18n (C):** `next-intl` message catalogs (RO/EN); enum values mapped to localized labels.

## 3. Tech stack

Next.js (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase JS client (server + browser)
· TanStack Table (data grids) · dnd-kit (Kanban) · Recharts (SiloBoard charts) · Zustand for the
little client state that survives navigation (UI prefs) · deploy on Vercel + Supabase.

## 4. Data model

Enums: `property_type(residential|industrial_hall|agricultural_land|silo_storage)`,
`property_status(rented|vacant|conservation|own_use)`, `currency(RON|EUR)`,
`area_unit(sqm|hectare)`, `lease_payment_method(cash|in_kind)`,
`lease_payment_status(paid|unpaid)`, `yard_status(gate|scale|dock|exited)`,
`yard_direction(inbound|outbound)`, `stock_txn_type(in|out)`, `user_role(admin|manager|operator)`.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id (FK auth.users)`, `full_name`, `role (user_role)` | drives RBAC |
| `properties` | `name`, `type`, `area_value`, `area_unit`, `energy_class?`, `thermal_insulation?`, `year_built?`, `status`, `accounting_value`, `currency` | extended per Doc 1 |
| `parcels` | `topo_code`, `area_ha`, `current_crop_id (FK crops)?`, `property_id (FK properties)?`, `notes` | **new** — agronomic registry |
| `parcel_crop_history` | `parcel_id (FK)`, `crop_id (FK)`, `season_year` | **new** — rotation log |
| `crops` | `name`, `name_en`, `color` | nomenclator (Grâu, Porumb, Rapiță, Orz, Floarea-Soarelui…) |
| `leases` | `parcel_id (FK parcels)`, `owner_name`, `owner_id_code (CNP/CUI)`, `contract_number`, `start_date`, `expiry_date`, `payment_method`, `payment_status`, `amount?` | FK→parcels; payment split into method+status |
| `storage_facilities` | `name`, `property_id (FK)?`, `max_capacity_ton`, `current_load_ton (maintained)` | silos/warehouses |
| `stock_transactions` | `facility_id (FK)`, `crop_id (FK)`, `txn_type`, `quantity_ton`, `txn_date`, `created_by (FK profiles)` | **new** — ledger |
| `yard_trucks` | `plate_number`, `driver`, `cargo_crop_id (FK)?`, `gross_weight?`, `tare_weight?`, `net_weight (generated = gross−tare)`, `direction`, `status`, `facility_id?`, `arrived_at`, `exited_at` | added gross/tare/cargo/direction |

DB behavior: `updated_at` triggers on mutable tables; generated `net_weight`; trigger maintaining
`storage_facilities.current_load_ton` from `stock_transactions`.

## 5. Modules

### Module 1 — Property & Asset Management
TanStack data table, server-fetched + paginated, quick filters (type, status), slide-over
create/edit form, portfolio total (Σ `accounting_value`, grouped by currency) in the header,
CSV export.

### Module 2 — Farm & Agribusiness
- **Parcels & Leases:** parcel registry with rotation history; **Lease Tracker** highlights rows
  where `expiry_date < now() + 60 days` in red (computed server-side, not a brittle client effect).
  Payment shown as method (Bani/Natură) × status (Plătit/Neplătit).
- **SiloBoard:** per-facility donut / vertical-fill chart of `current_load_ton / max_capacity_ton`;
  **Inventory form** writes a `stock_transaction` (in/out) and the maintained load updates.

### Module 3 — Yard Logistics
dnd-kit Kanban with 4 columns (Poartă → La Cântar → La Descărcare → Ieșit). Truck cards show
plate + driver + net weight. Dragging persists `status` via a server action; exit can optionally
spawn a `stock_transaction`.

## 6. Dashboard (Homepage KPIs)
1. **Total managed area** — aggregate land (ha) + buildings (sqm).
2. **Total patrimony value** — Σ `accounting_value` by currency.
3. **Current grain stock** — total tons per crop across facilities.
4. **Urgent alerts** — leases/contracts expiring within 60 days.

## 7. Auth, roles & RLS
Supabase Auth (email/password). RLS keyed on `profiles.role`:
- **Admin** — full CRUD everywhere + user management.
- **Manager** — full CRUD on properties, parcels, leases, storage, inventory; read yard.
- **Operator** — yard_trucks CRUD + insert stock_transactions; read-only elsewhere.

## 8. Cross-cutting
- **Responsive/tablet-first** — field managers use tablets/phones; tables and Kanban degrade
  gracefully (`sm:`/`md:`/`lg:`).
- **Errors → toast notifications** (Doc 2 rule); consistent empty / loading / error states.
- **Mock-data parity** — build UI against typed mock data first (Doc 2 dummy endpoints), then wire
  Supabase, so components stay isolated and testable.

## 9. Testing
- **Unit:** net-weight, fill-%, portfolio totals, 60-day expiry logic.
- **Integration:** server actions + RLS policies (per-role access).
- **E2E (Playwright):** happy path per module.
- **Responsive smoke checks** at tablet/phone widths.

## 10. Phased build sequence
0. **Scaffold** — Next.js+TS, Tailwind+shadcn, Supabase project, auth + profiles/roles, next-intl,
   app shell/nav, CI/lint.
1. **Data layer** — migrations, enums, triggers, RLS, seed (crops + demo data).
2. **Module 1 — Properties.**
3. **Module 2 — Parcels/Leases + SiloBoard.**
4. **Module 3 — Yard Kanban.**
5. **Dashboard KPIs + alerts.**
6. **Polish** — responsive QA, CSV export, a11y, RBAC review, Vercel/Supabase deploy.

## 11. Out of scope (YAGNI for MVP)
Accounting/invoicing integrations, payroll, multi-tenant orgs, mobile-native apps, offline mode,
external weighbridge/IoT hardware integration, advanced reporting/BI. Schema leaves room (FKs,
ledger) but these are not built in the MVP.
