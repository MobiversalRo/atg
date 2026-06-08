create type stock_txn_type as enum ('in', 'out');

-- Silos / warehouses with a maintained current load.
create table storage_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  property_id uuid references properties (id),
  max_capacity_ton numeric not null default 0,
  current_load_ton numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger storage_facilities_updated_at
  before update on storage_facilities
  for each row execute function set_updated_at();

-- Append-only stock movements; the source of truth for current load.
create table stock_transactions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references storage_facilities (id),
  crop_id uuid not null references crops (id),
  txn_type stock_txn_type not null,
  quantity_ton numeric not null check (quantity_ton > 0),
  txn_date date not null default current_date,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- Keep storage_facilities.current_load_ton in sync with the ledger.
create function apply_stock_txn()
returns trigger
language plpgsql
as $$
begin
  update storage_facilities
  set current_load_ton = current_load_ton
    + (case when new.txn_type = 'in' then new.quantity_ton else -new.quantity_ton end)
  where id = new.facility_id;
  return new;
end;
$$;

create trigger trg_apply_stock_txn
  after insert on stock_transactions
  for each row execute function apply_stock_txn();
