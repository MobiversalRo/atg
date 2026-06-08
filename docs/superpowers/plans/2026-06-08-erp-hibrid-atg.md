# Hybrid ERP MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (RO/EN), role-aware web ERP that replaces Excel-based management of real-estate and agribusiness assets with three operational modules + a KPI dashboard.

**Architecture:** Next.js App Router (TypeScript) on Vercel, Supabase (Postgres + Auth + RLS) as the backend. Reads via Server Components, mutations via Server Actions; `"use client"` only for interactive UI (Kanban, forms, charts). RLS keyed on `profiles.role` is the security boundary. Inventory is an append-only ledger with a trigger-maintained current load.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase JS · next-intl · TanStack Table · dnd-kit · Recharts · Zustand · Vitest · Playwright.

**Spec:** `docs/superpowers/specs/2026-06-08-erp-hibrid-atg-design.md`

---

## File Structure Map

```
src/
  app/
    [locale]/
      layout.tsx                 # locale provider + app shell
      (auth)/login/page.tsx
      (app)/
        layout.tsx               # sidebar + topbar, auth guard
        page.tsx                 # dashboard
        properties/page.tsx
        farm/page.tsx            # parcels + leases + siloboard tabs
        yard/page.tsx            # kanban
    api/                         # only if a webhook/cron is needed
  components/
    ui/                          # shadcn primitives
    shell/{sidebar,topbar,locale-switcher,user-menu}.tsx
    properties/{property-table,property-form,portfolio-total}.tsx
    farm/{lease-table,parcel-table,silo-board,inventory-form}.tsx
    yard/{kanban-board,truck-card}.tsx
  lib/
    domain/                      # PURE functions (TDD core)
      weights.ts                 # net weight
      inventory.ts               # fill %, load from ledger
      leases.ts                  # expiry/alert logic
      portfolio.ts               # totals by currency/area
    supabase/{server.ts,browser.ts,middleware.ts}
    auth/rbac.ts                 # role helpers
    actions/                     # server actions per module
  i18n/{routing.ts,request.ts}
  messages/{ro.json,en.json}
supabase/
  migrations/                    # SQL migrations
  seed.sql
tests/
  unit/  e2e/
middleware.ts                    # next-intl + auth
```

---

## Phase 0 — Scaffold & Foundation

### Task 0.1: Create the Next.js + TypeScript + Tailwind project

**Files:** project root (generated).

- [ ] **Step 1: Scaffold**

```bash
npx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

- [ ] **Step 2: Verify dev server boots**

Run: `npm run dev` → open http://localhost:3000
Expected: default Next.js page renders, no console errors. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold next.js app with typescript and tailwind"
```

### Task 0.2: Install shadcn/ui + base primitives

**Files:** `components.json`, `src/components/ui/*`.

- [ ] **Step 1: Init shadcn and add primitives**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input select table dialog sheet card badge sonner dropdown-menu tabs form label
```

- [ ] **Step 2: Verify** the `Button` import resolves: add `<Button>Test</Button>` to the home page, run `npm run build`. Expected: build succeeds. Revert the edit.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: add shadcn/ui and base components"
```

### Task 0.3: Configure next-intl (RO default + EN)

**Files:** `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/messages/ro.json`, `src/messages/en.json`, `middleware.ts`, `src/app/[locale]/layout.tsx`.

- [ ] **Step 1: Install** — `npm i next-intl`

- [ ] **Step 2: Routing config**

```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['ro', 'en'],
  defaultLocale: 'ro',
});
```

- [ ] **Step 3: Request config + middleware + message files** following next-intl App Router docs; seed `ro.json`/`en.json` with `nav`, `common`, `auth` keys (e.g. `"common.save": "Salvează"/"Save"`).

- [ ] **Step 4: Locale switcher** `src/components/shell/locale-switcher.tsx` (client) toggling the `[locale]` segment.

- [ ] **Step 5: Verify** `/ro` and `/en` render localized strings. Run `npm run build`. Expected: PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat: bilingual ro/en routing with next-intl"`

### Task 0.4: Supabase clients + env

**Files:** `src/lib/supabase/{server.ts,browser.ts,middleware.ts}`, `.env.local`, `.env.example`.

- [ ] **Step 1: Install** — `npm i @supabase/supabase-js @supabase/ssr`
- [ ] **Step 2:** Create a Supabase project (dashboard) and put `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`; mirror keys (no values) in `.env.example`.
- [ ] **Step 3:** Implement browser + server clients with `@supabase/ssr` (cookie-based sessions) per official docs.
- [ ] **Step 4: Verify** a server component can call `supabase.auth.getUser()` without error (returns null when logged out).
- [ ] **Step 5: Commit** — `git commit -am "feat: supabase server and browser clients"`

### Task 0.5: Auth + profiles + RBAC helper

**Files:** `supabase/migrations/0001_profiles.sql`, `src/lib/auth/rbac.ts`, `src/app/[locale]/(auth)/login/page.tsx`, `middleware.ts` (auth guard).

- [ ] **Step 1: profiles migration**

```sql
create type user_role as enum ('admin','manager','operator');
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role user_role not null default 'operator',
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "self read" on profiles for select using (auth.uid() = id);
-- trigger: insert a profile row on new auth user
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 2: RBAC helper test (TDD)** — `tests/unit/rbac.test.ts`

```ts
import { can } from '@/lib/auth/rbac';
test('operator cannot edit properties', () => {
  expect(can('operator', 'properties', 'update')).toBe(false);
});
test('manager can edit leases', () => {
  expect(can('manager', 'leases', 'update')).toBe(true);
});
test('admin can do anything', () => {
  expect(can('admin', 'yard_trucks', 'delete')).toBe(true);
});
```

- [ ] **Step 3: Run test → FAIL** (`can` not defined). Run: `npx vitest run tests/unit/rbac.test.ts`
- [ ] **Step 4: Implement `can()`**

```ts
// src/lib/auth/rbac.ts
export type Role = 'admin' | 'manager' | 'operator';
type Resource = 'properties'|'parcels'|'leases'|'storage'|'inventory'|'yard_trucks';
type Action = 'create'|'read'|'update'|'delete';
const MANAGER_WRITE: Resource[] = ['properties','parcels','leases','storage','inventory'];
export function can(role: Role, resource: Resource, action: Action): boolean {
  if (role === 'admin') return true;
  if (action === 'read') return true;
  if (role === 'manager') return MANAGER_WRITE.includes(resource);
  // operator
  if (resource === 'yard_trucks') return true;
  if (resource === 'inventory' && action === 'create') return true;
  return false;
}
```

- [ ] **Step 5: Run test → PASS.**
- [ ] **Step 6:** Build login page (email/password via Supabase Auth) + middleware redirect to `/login` when unauthenticated.
- [ ] **Step 7: Commit** — `git commit -am "feat: auth, profiles, and rbac helper"`

### Task 0.6: App shell + toast provider

**Files:** `src/app/[locale]/(app)/layout.tsx`, `src/components/shell/{sidebar,topbar,user-menu}.tsx`.

- [ ] **Step 1:** Build responsive shell — collapsible sidebar (Dashboard, Properties, Farm, Yard), topbar with locale switcher + user menu (sign out). Mount `<Toaster/>` (sonner).
- [ ] **Step 2:** Auth guard in the `(app)` layout: redirect to `/login` if no user; fetch `profile.role` and pass to a context/provider.
- [ ] **Step 3: Verify** logged-out hits `/login`; logged-in sees the shell at tablet + desktop widths.
- [ ] **Step 4: Commit** — `git commit -am "feat: responsive app shell with nav and toasts"`

### Task 0.7: Test + lint tooling

**Files:** `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`.

- [ ] **Step 1: Install** — `npm i -D vitest @testing-library/react jsdom @playwright/test`
- [ ] **Step 2:** Configure Vitest (jsdom) + Playwright (baseURL localhost:3000). Add scripts: `"test": "vitest run"`, `"test:e2e": "playwright test"`.
- [ ] **Step 3:** CI workflow: install, lint, `npm run build`, `npm test`.
- [ ] **Step 4: Verify** — `npm test` runs the rbac test green.
- [ ] **Step 5: Commit** — `git commit -am "chore: vitest, playwright, and CI"`

---

## Phase 1 — Data Layer

### Task 1.1: Core enums, crops, properties

**Files:** `supabase/migrations/0002_core.sql`.

- [ ] **Step 1: Migration**

```sql
create type property_type as enum ('residential','industrial_hall','agricultural_land','silo_storage');
create type property_status as enum ('rented','vacant','conservation','own_use');
create type currency as enum ('RON','EUR');
create type area_unit as enum ('sqm','hectare');

create table crops (
  id uuid primary key default gen_random_uuid(),
  name text not null, name_en text not null, color text not null default '#888'
);
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type property_type not null,
  area_value numeric not null default 0,
  area_unit area_unit not null,
  energy_class text,
  thermal_insulation boolean,
  year_built int,
  status property_status not null default 'vacant',
  accounting_value numeric not null default 0,
  currency currency not null default 'RON',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 2: Apply & commit** — apply via Supabase SQL editor or `supabase db push`; `git commit -am "feat(db): core enums, crops, properties"`

### Task 1.2: Parcels, rotation history, leases

**Files:** `supabase/migrations/0003_farm.sql`.

- [ ] **Step 1: Migration**

```sql
create type lease_payment_method as enum ('cash','in_kind');
create type lease_payment_status as enum ('paid','unpaid');

create table parcels (
  id uuid primary key default gen_random_uuid(),
  topo_code text not null,
  area_ha numeric not null default 0,
  current_crop_id uuid references crops(id),
  property_id uuid references properties(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table parcel_crop_history (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  crop_id uuid not null references crops(id),
  season_year int not null
);
create table leases (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels(id),
  owner_name text not null,
  owner_id_code text,
  contract_number text,
  start_date date,
  expiry_date date,
  payment_method lease_payment_method not null default 'cash',
  payment_status lease_payment_status not null default 'unpaid',
  amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 2: Commit** — `git commit -am "feat(db): parcels, rotation history, leases"`

### Task 1.3: Storage facilities + stock ledger + load trigger

**Files:** `supabase/migrations/0004_inventory.sql`.

- [ ] **Step 1: Migration**

```sql
create type stock_txn_type as enum ('in','out');
create table storage_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  property_id uuid references properties(id),
  max_capacity_ton numeric not null default 0,
  current_load_ton numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table stock_transactions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references storage_facilities(id),
  crop_id uuid not null references crops(id),
  txn_type stock_txn_type not null,
  quantity_ton numeric not null check (quantity_ton > 0),
  txn_date date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create function apply_stock_txn() returns trigger language plpgsql as $$
begin
  update storage_facilities set current_load_ton = current_load_ton
    + (case when new.txn_type='in' then new.quantity_ton else -new.quantity_ton end)
  where id = new.facility_id;
  return new;
end; $$;
create trigger trg_apply_stock_txn after insert on stock_transactions
  for each row execute function apply_stock_txn();
```

- [ ] **Step 2: Commit** — `git commit -am "feat(db): storage facilities and stock ledger with load trigger"`

### Task 1.4: Yard trucks (generated net weight)

**Files:** `supabase/migrations/0005_yard.sql`.

- [ ] **Step 1: Migration**

```sql
create type yard_status as enum ('gate','scale','dock','exited');
create type yard_direction as enum ('inbound','outbound');
create table yard_trucks (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null,
  driver text,
  cargo_crop_id uuid references crops(id),
  gross_weight numeric,
  tare_weight numeric,
  net_weight numeric generated always as (coalesce(gross_weight,0) - coalesce(tare_weight,0)) stored,
  direction yard_direction not null default 'inbound',
  status yard_status not null default 'gate',
  facility_id uuid references storage_facilities(id),
  arrived_at timestamptz default now(),
  exited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 2: Commit** — `git commit -am "feat(db): yard trucks with generated net weight"`

### Task 1.5: RLS policies per role

**Files:** `supabase/migrations/0006_rls.sql`.

- [ ] **Step 1:** Enable RLS on all domain tables. Add a SQL helper `auth_role()` reading `profiles.role` for `auth.uid()`. Policies:
  - `select` for any authenticated user on all tables.
  - `insert/update/delete` on properties, parcels, parcel_crop_history, leases, storage_facilities → `auth_role() in ('admin','manager')`.
  - `insert/update/delete` on stock_transactions → `auth_role() in ('admin','manager','operator')`.
  - `insert/update/delete` on yard_trucks → `auth_role() in ('admin','manager','operator')`.
  - profiles update → admin only.
- [ ] **Step 2: Verify** — with the anon/operator JWT, an `update properties` is rejected; an `insert yard_trucks` succeeds (test via SQL editor with role-scoped tokens, or an integration test in Task 1.7).
- [ ] **Step 3: Commit** — `git commit -am "feat(db): rls policies per role"`

### Task 1.6: Generated DB types + seed

**Files:** `src/lib/supabase/types.ts`, `supabase/seed.sql`.

- [ ] **Step 1:** Generate types — `npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`.
- [ ] **Step 2:** `seed.sql` — 5 crops (Grâu/Wheat, Porumb/Corn, Rapiță/Rapeseed, Orz/Barley, Floarea-Soarelui/Sunflower), ~6 properties, ~4 parcels, ~3 leases (one expiring in 30 days), ~3 facilities, a handful of stock transactions, ~4 trucks across statuses.
- [ ] **Step 3: Commit** — `git commit -am "chore(db): generated types and seed data"`

### Task 1.7: Domain logic library (TDD)

**Files:** `src/lib/domain/{weights,inventory,leases,portfolio}.ts` + `tests/unit/domain.test.ts`.

- [ ] **Step 1: Write failing tests**

```ts
import { netWeight } from '@/lib/domain/weights';
import { fillPercent } from '@/lib/domain/inventory';
import { isExpiringSoon, daysUntil } from '@/lib/domain/leases';
import { portfolioByCurrency, totalAreaSqm } from '@/lib/domain/portfolio';

test('netWeight = gross - tare, never negative', () => {
  expect(netWeight(30, 12)).toBe(18);
  expect(netWeight(5, 12)).toBe(0);
});
test('fillPercent clamps 0..100', () => {
  expect(fillPercent(3250, 5000)).toBeCloseTo(65);
  expect(fillPercent(10, 0)).toBe(0);
  expect(fillPercent(6000, 5000)).toBe(100);
});
test('isExpiringSoon true within 60 days', () => {
  const today = new Date('2026-06-08');
  expect(isExpiringSoon('2026-07-01', 60, today)).toBe(true);
  expect(isExpiringSoon('2026-09-01', 60, today)).toBe(false);
  expect(daysUntil('2026-07-08', today)).toBe(30);
});
test('portfolioByCurrency sums per currency', () => {
  const rows = [
    { accounting_value: 100, currency: 'RON' },
    { accounting_value: 50, currency: 'RON' },
    { accounting_value: 20, currency: 'EUR' },
  ];
  expect(portfolioByCurrency(rows)).toEqual({ RON: 150, EUR: 20 });
});
test('totalAreaSqm converts hectares', () => {
  expect(totalAreaSqm([
    { area_value: 1, area_unit: 'hectare' },
    { area_value: 500, area_unit: 'sqm' },
  ])).toBe(10500);
});
```

- [ ] **Step 2: Run → FAIL.** `npx vitest run tests/unit/domain.test.ts`
- [ ] **Step 3: Implement**

```ts
// weights.ts
export const netWeight = (gross = 0, tare = 0) => Math.max(0, gross - tare);
// inventory.ts
export const fillPercent = (load: number, cap: number) =>
  cap <= 0 ? 0 : Math.min(100, Math.max(0, (load / cap) * 100));
// leases.ts
export const daysUntil = (date: string, from = new Date()) =>
  Math.round((new Date(date).getTime() - from.getTime()) / 86_400_000);
export const isExpiringSoon = (date: string, within = 60, from = new Date()) => {
  const d = daysUntil(date, from); return d >= 0 && d <= within;
};
// portfolio.ts
export const portfolioByCurrency = (rows: { accounting_value: number; currency: string }[]) =>
  rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.currency]: (a[r.currency] ?? 0) + r.accounting_value }), {});
export const totalAreaSqm = (rows: { area_value: number; area_unit: string }[]) =>
  rows.reduce((a, r) => a + (r.area_unit === 'hectare' ? r.area_value * 10_000 : r.area_value), 0);
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat(domain): weights, inventory, lease, portfolio logic with tests"`

---

## Phase 2 — Module 1: Property & Asset Management

### Task 2.1: Property server actions

**Files:** `src/lib/actions/properties.ts`.

- [ ] **Step 1:** Implement `listProperties(filters)`, `createProperty(input)`, `updateProperty(id, input)`, `deleteProperty(id)` as server actions using the server Supabase client; validate input with `zod`; `revalidatePath('/[locale]/properties')`; return typed results, surfacing errors for toast.
- [ ] **Step 2:** Unit-test the zod schema (valid/invalid payloads). Run `npx vitest run`. Expected: PASS.
- [ ] **Step 3: Commit** — `git commit -am "feat(properties): server actions + validation"`

### Task 2.2: Property data table + portfolio header

**Files:** `src/components/properties/{property-table,portfolio-total}.tsx`, `src/app/[locale]/(app)/properties/page.tsx`.

- [ ] **Step 1:** Server component page fetches properties (server action) and renders `<PortfolioTotal/>` (uses `portfolioByCurrency`) + `<PropertyTable/>`.
- [ ] **Step 2:** `PropertyTable` (client, TanStack Table): columns name/type/area/status/value, pagination, quick filters for `type` + `status`, row actions (edit/delete). All labels via next-intl; enum values localized.
- [ ] **Step 3: Verify** seeded properties render; filtering by type narrows rows; header total matches seed sums.
- [ ] **Step 4: Commit** — `git commit -am "feat(properties): data table with filters and portfolio total"`

### Task 2.3: Slide-over create/edit form

**Files:** `src/components/properties/property-form.tsx`.

- [ ] **Step 1:** shadcn `Sheet` + `Form` (react-hook-form + zod) covering all fields incl. currency, area unit, energy class, status. Submit calls create/update action; success → toast + close + refresh; error → toast.
- [ ] **Step 2: Verify** create adds a row; edit persists; validation blocks empty name.
- [ ] **Step 3: Commit** — `git commit -am "feat(properties): slide-over create/edit form"`

### Task 2.4: CSV export + E2E

**Files:** `src/lib/csv.ts`, `tests/e2e/properties.spec.ts`.

- [ ] **Step 1:** `toCsv(rows, columns)` pure fn + unit test (header row, escaping commas/quotes).
- [ ] **Step 2:** Export button downloads current filtered rows.
- [ ] **Step 3: Playwright E2E** — login → properties → create a property → assert it appears → filter → export.
- [ ] **Step 4: Commit** — `git commit -am "feat(properties): csv export and e2e"`

---

## Phase 3 — Module 2: Farm & Agribusiness

### Task 3.1: Parcels registry + rotation history

**Files:** `src/lib/actions/parcels.ts`, `src/components/farm/parcel-table.tsx`, farm page tab.

- [ ] CRUD server actions for parcels; table with area_ha + current crop; expandable rotation history (reads `parcel_crop_history`); add-history form. Verify seeded parcels + history render. Commit.

### Task 3.2: Lease tracker with 60-day alerts

**Files:** `src/lib/actions/leases.ts`, `src/components/farm/lease-table.tsx`.

- [ ] CRUD lease server actions. Table columns owner/contract/expiry/payment. Rows where `isExpiringSoon(expiry_date)` get a red `Badge`/row tint (computed server-side from `daysUntil`). Payment shown as method × status badges. Verify the 30-day seed lease is flagged red. Commit.

### Task 3.3: SiloBoard + inventory form

**Files:** `src/lib/actions/inventory.ts`, `src/components/farm/{silo-board,inventory-form}.tsx`.

- [ ] **Step 1:** `recordStockTransaction(input)` server action inserts into `stock_transactions` (trigger updates load); revalidate.
- [ ] **Step 2:** `SiloBoard` renders one Recharts donut/vertical-fill per facility using `fillPercent(current_load_ton, max_capacity_ton)`, color-coded by crop.
- [ ] **Step 3:** `InventoryForm` (facility + crop + in/out + tons) records a transaction; SiloBoard updates after refresh.
- [ ] **Step 4: Verify** an `in` transaction raises the fill %, an `out` lowers it; operator role can submit. Commit.

---

## Phase 4 — Module 3: Yard Logistics (Kanban)

### Task 4.1: Yard server actions

**Files:** `src/lib/actions/yard.ts`.

- [ ] `listTrucks()`, `createTruck()`, `updateTruckStatus(id, status)`, `updateTruckWeights(id, gross, tare)`. On `status='exited'` set `exited_at`; optionally call `recordStockTransaction` when weights + facility + crop are present. Commit.

### Task 4.2: Kanban board + truck cards

**Files:** `src/components/yard/{kanban-board,truck-card}.tsx`, yard page.

- [ ] **Step 1:** dnd-kit board with 4 columns (Poartă/La Cântar/La Descărcare/Ieșit). `TruckCard` shows plate + driver + net weight.
- [ ] **Step 2:** On drop into a new column, optimistic move + `updateTruckStatus` server action; error → toast + revert.
- [ ] **Step 3:** "Add truck" + a weigh action (gross/tare) on cards; net weight recomputed by the DB generated column on refetch.
- [ ] **Step 4: Verify** dragging persists across reload; weighing computes net. Responsive: columns stack/scroll on tablet. Commit.
- [ ] **Step 5: E2E** — add truck → drag gate→scale→dock→exited → assert persisted.

---

## Phase 5 — Dashboard KPIs

### Task 5.1: KPI aggregations + cards

**Files:** `src/lib/actions/dashboard.ts`, `src/components/dashboard/*`, `src/app/[locale]/(app)/page.tsx`.

- [ ] **Step 1:** Server fetch + aggregate using domain fns: total managed area (`totalAreaSqm` + ha breakdown), total patrimony value (`portfolioByCurrency`), grain stock tons per crop (sum facility loads grouped by crop), expiring leases (count where `isExpiringSoon`).
- [ ] **Step 2:** Four KPI cards + an "urgent alerts" list linking to the relevant lease rows.
- [ ] **Step 3: Verify** KPI numbers reconcile with seed data. Commit.

---

## Phase 6 — Polish & Deploy

### Task 6.1: Responsive + states pass
- [ ] Audit each module at 768px and 390px widths; ensure tables scroll, Kanban stacks, forms usable. Add empty/loading/error states (skeletons + toast on action errors). Commit.

### Task 6.2: RBAC enforcement in UI
- [ ] Hide/disable create/edit/delete controls via `can(role, ...)`; confirm RLS still blocks server-side if bypassed. Add an integration test asserting an operator's `updateProperty` is rejected. Commit.

### Task 6.3: Accessibility + i18n completeness
- [ ] Keyboard nav on Kanban + dialogs; labels/aria; verify no hardcoded strings remain (all via `messages/*`). Commit.

### Task 6.4: Deploy
- [ ] Connect repo to Vercel; set env vars; point at the Supabase project; run migrations + seed on the prod DB; smoke-test login + each module. Commit any config.

---

## Self-Review

**Spec coverage:** Auth/roles (0.5, 1.5, 6.2) · bilingual (0.3, 6.3) · Module 1 (Phase 2) · parcels+rotation (3.1) · lease 60-day alert (3.2) · SiloBoard ledger (1.3, 3.3) · Yard Kanban + weights (Phase 4) · Dashboard KPIs (Phase 5) · responsive/toasts (0.6, 6.1) · testing (0.7 + per-module). All spec sections map to a task.

**Type consistency:** `can(role, resource, action)`, `netWeight`, `fillPercent`, `isExpiringSoon`/`daysUntil`, `portfolioByCurrency`, `totalAreaSqm` are defined once (Tasks 0.5, 1.7) and reused by name in Phases 2–5. Column/enum names match the migrations in Phase 1.

**Placeholders:** Foundation + domain tasks carry full code/SQL/tests. Phase 3–6 UI tasks specify exact files, behavior, the domain fn they consume, and a verify step; their internal JSX is assembled against shadcn primitives installed in 0.2 (resolved during build, not left as logic gaps).
