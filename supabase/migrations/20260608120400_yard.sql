create type yard_status as enum ('gate', 'scale', 'dock', 'exited');
create type yard_direction as enum ('inbound', 'outbound');

-- Trucks moving through the yard; net weight is derived.
create table yard_trucks (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null,
  driver text,
  cargo_crop_id uuid references crops (id),
  gross_weight numeric,
  tare_weight numeric,
  net_weight numeric generated always as (
    greatest(coalesce(gross_weight, 0) - coalesce(tare_weight, 0), 0)
  ) stored,
  direction yard_direction not null default 'inbound',
  status yard_status not null default 'gate',
  facility_id uuid references storage_facilities (id),
  arrived_at timestamptz default now(),
  exited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger yard_trucks_updated_at
  before update on yard_trucks
  for each row execute function set_updated_at();
