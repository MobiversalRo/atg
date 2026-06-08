-- Returns the role of the current user. SECURITY DEFINER so policies can read
-- profiles without recursing into profiles' own RLS.
create function auth_role()
returns user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- profiles: a user reads their own row; admins read and manage all.
-- ---------------------------------------------------------------------------
create policy "profiles_select" on profiles
  for select to authenticated
  using (id = auth.uid() or auth_role() = 'admin');
create policy "profiles_admin_all" on profiles
  for all to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Any authenticated user can read every domain table.
-- Writes on assets/farm/storage are limited to admin + manager.
-- ---------------------------------------------------------------------------
alter table crops enable row level security;
alter table properties enable row level security;
alter table parcels enable row level security;
alter table parcel_crop_history enable row level security;
alter table leases enable row level security;
alter table storage_facilities enable row level security;
alter table stock_transactions enable row level security;
alter table yard_trucks enable row level security;

-- Manager/admin-writable tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'crops', 'properties', 'parcels', 'parcel_crop_history', 'leases', 'storage_facilities'
  ]
  loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (auth_role() in (''admin'', ''manager''))', t || '_insert', t);
    execute format('create policy %I on %I for update to authenticated using (auth_role() in (''admin'', ''manager'')) with check (auth_role() in (''admin'', ''manager''))', t || '_update', t);
    execute format('create policy %I on %I for delete to authenticated using (auth_role() in (''admin'', ''manager''))', t || '_delete', t);
  end loop;
end;
$$;

-- Operator-writable tables (operators record yard movements and stock entries).
do $$
declare
  t text;
begin
  foreach t in array array['stock_transactions', 'yard_trucks']
  loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (auth_role() in (''admin'', ''manager'', ''operator''))', t || '_insert', t);
    execute format('create policy %I on %I for update to authenticated using (auth_role() in (''admin'', ''manager'', ''operator'')) with check (auth_role() in (''admin'', ''manager'', ''operator''))', t || '_update', t);
    execute format('create policy %I on %I for delete to authenticated using (auth_role() in (''admin'', ''manager''))', t || '_delete', t);
  end loop;
end;
$$;
