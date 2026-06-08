-- Shared trigger to keep updated_at fresh on row updates.
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type property_type as enum (
  'residential',
  'industrial_hall',
  'agricultural_land',
  'silo_storage'
);
create type property_status as enum ('rented', 'vacant', 'conservation', 'own_use');
create type currency as enum ('RON', 'EUR');
create type area_unit as enum ('sqm', 'hectare');

-- Crop nomenclator (Grâu, Porumb, Rapiță, Orz, Floarea-Soarelui, ...).
create table crops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null,
  color text not null default '#888888'
);

-- Real-estate and physical assets.
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type property_type not null,
  area_value numeric not null default 0,
  area_unit area_unit not null default 'sqm',
  energy_class text,
  thermal_insulation boolean,
  year_built int,
  status property_status not null default 'vacant',
  accounting_value numeric not null default 0,
  currency currency not null default 'RON',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger properties_updated_at
  before update on properties
  for each row execute function set_updated_at();
