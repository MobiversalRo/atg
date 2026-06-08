create type lease_payment_method as enum ('cash', 'in_kind');
create type lease_payment_status as enum ('paid', 'unpaid');

-- Agricultural parcels (arende).
create table parcels (
  id uuid primary key default gen_random_uuid(),
  topo_code text not null,
  area_ha numeric not null default 0,
  current_crop_id uuid references crops (id),
  property_id uuid references properties (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger parcels_updated_at
  before update on parcels
  for each row execute function set_updated_at();

-- Crop rotation history per parcel and season.
create table parcel_crop_history (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels (id) on delete cascade,
  crop_id uuid not null references crops (id),
  season_year int not null
);

-- Lease/arenda contracts tied to a parcel.
create table leases (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels (id),
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
create trigger leases_updated_at
  before update on leases
  for each row execute function set_updated_at();
