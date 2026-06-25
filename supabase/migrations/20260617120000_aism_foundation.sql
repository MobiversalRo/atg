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

-- Private bucket for scanned documents. CF-4: no delete, no update (immutable).
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Authenticated users can read and upload; NO update, NO delete policy => both denied by RLS.
create policy "documents_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
create policy "documents_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
-- Intentionally absent: UPDATE and DELETE policies on bucket 'documents'.
