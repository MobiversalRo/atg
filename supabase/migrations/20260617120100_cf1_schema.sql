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
alter table parcels add column tp text;
alter table parcels add column area_sqm numeric not null default 0;
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
