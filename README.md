# ERP Hibrid ATG / Investopia

A hybrid ERP MVP for **SC AGISM S.R.L.** (built by ATG Investopia) that replaces
Excel-based management of real-estate and agribusiness assets with a single,
bilingual (RO/EN), responsive web app.

## Modules

- **Properties** — asset registry with CRUD data table, filters, portfolio total, CSV export
- **Farm** — agricultural parcels + crop-rotation history, lease tracker with 60-day expiry alerts, SiloBoard inventory (donut gauges + ledger)
- **Yard** — drag-and-drop Kanban (Gate → Scale → Dock → Exited) with truck weighing
- **Dashboard** — KPIs: managed area, patrimony value, grain stock per crop, expiring-lease alerts

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Supabase
(Postgres + Auth + RLS) · next-intl · TanStack Table · dnd-kit · Vitest · Playwright.

## Prerequisites

- Node 20+
- Docker (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

## Local development

```bash
npm install
supabase start                 # boots local Postgres + Auth + Studio (Docker)
cp .env.example .env.local     # then fill with values from `supabase status`
supabase db reset              # apply migrations + seed
npm run dev                    # http://localhost:3000  (redirects to /ro)
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from `supabase status`>
```

### Seeded logins (password `password123`)

| Email | Role | Access |
|---|---|---|
| `admin@atg.local` | admin | everything |
| `manager@atg.local` | manager | assets, parcels, leases, storage, inventory |
| `operator@atg.local` | operator | yard + stock entries; read-only elsewhere |

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E (auto-starts the dev server) |

## Database

Migrations live in `supabase/migrations/`, seed in `supabase/seed.sql`.

```bash
supabase db reset                                                  # re-apply migrations + seed
supabase gen types typescript --local > src/lib/supabase/types.ts  # regenerate types after schema changes
```

Row-Level Security enforces the role model in Postgres; `src/lib/auth/rbac.ts`
mirrors it so the UI can hide controls.

## Deployment (Supabase cloud + Vercel)

1. **Create a Supabase project** at supabase.com, then link and push:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies migrations to the cloud DB
   # optionally seed the cloud DB (run supabase/seed.sql via the SQL editor)
   ```
2. **Vercel** — import the repo and set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` → cloud project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cloud publishable/anon key
3. Deploy. In Supabase Auth settings, add the Vercel URL to the allowed redirect/site URLs.

## Documentation

- Design spec: `docs/superpowers/specs/2026-06-08-erp-hibrid-atg-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-08-erp-hibrid-atg.md`
