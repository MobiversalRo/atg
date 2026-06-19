-- ===========================================================================
-- Seed data for local development. Re-run automatically by `supabase db reset`.
-- Login users (password "password123"): admin@atg.local, manager@atg.local,
-- operator@atg.local. The on_auth_user_created trigger creates each profile;
-- we then promote it to the right role.
-- ===========================================================================

-- --- Users ------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', u.full_name), now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@atg.local', 'Admin ATG'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'manager@atg.local', 'Manager Fermă'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'operator@atg.local', 'Operator Curte')
) as u (id, email, full_name);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email), 'email',
  now(), now(), now()
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@atg.local'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'manager@atg.local'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'operator@atg.local')
) as u (id, email);

update profiles set role = 'admin', full_name = 'Admin ATG'
  where id = '11111111-1111-1111-1111-111111111111';
update profiles set role = 'manager', full_name = 'Manager Fermă'
  where id = '22222222-2222-2222-2222-222222222222';
update profiles set role = 'operator', full_name = 'Operator Curte'
  where id = '33333333-3333-3333-3333-333333333333';

-- --- Crops (nomenclator) ----------------------------------------------------
insert into crops (id, name, name_en, color) values
  ('a0000000-0000-0000-0000-000000000001', 'Grâu', 'Wheat', '#E3B505'),
  ('a0000000-0000-0000-0000-000000000002', 'Porumb', 'Corn', '#F4D35E'),
  ('a0000000-0000-0000-0000-000000000003', 'Rapiță', 'Rapeseed', '#F2C14E'),
  ('a0000000-0000-0000-0000-000000000004', 'Orz', 'Barley', '#C19875'),
  ('a0000000-0000-0000-0000-000000000005', 'Floarea-Soarelui', 'Sunflower', '#FCA311');

-- --- Properties -------------------------------------------------------------
insert into properties (id, name, type, area_value, area_unit, energy_class, thermal_insulation, year_built, status, accounting_value, currency) values
  ('b0000000-0000-0000-0000-000000000001', 'Siloz Cerealier 1', 'silo_storage', 1200, 'sqm', null, true, 2015, 'own_use', 850000, 'RON'),
  ('b0000000-0000-0000-0000-000000000002', 'Hală Utilaje', 'industrial_hall', 800, 'sqm', 'C', true, 2010, 'own_use', 420000, 'RON'),
  ('b0000000-0000-0000-0000-000000000003', 'Teren Agricol Vest', 'agricultural_land', 45, 'hectare', null, null, null, 'own_use', 540000, 'RON'),
  ('b0000000-0000-0000-0000-000000000004', 'Apartament Centru', 'residential', 75, 'sqm', 'B', true, 2018, 'rented', 95000, 'EUR'),
  ('b0000000-0000-0000-0000-000000000005', 'Magazia A', 'silo_storage', 600, 'sqm', null, false, 2008, 'own_use', 300000, 'RON'),
  ('b0000000-0000-0000-0000-000000000006', 'Teren Agricol Est', 'agricultural_land', 30, 'hectare', null, null, null, 'rented', 360000, 'RON');

-- --- Parcels + rotation history ---------------------------------------------
insert into parcels (id, topo_code, area_sqm, current_crop_id, property_id, notes) values
  ('c0000000-0000-0000-0000-000000000001', 'Topo 45', 450000, 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Sol cernoziom'),
  ('c0000000-0000-0000-0000-000000000002', 'Topo 46', 300000, 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', null),
  ('c0000000-0000-0000-0000-000000000003', 'Topo 50', 220000, 'a0000000-0000-0000-0000-000000000003', null, null),
  ('c0000000-0000-0000-0000-000000000004', 'Topo 51', 180000, 'a0000000-0000-0000-0000-000000000004', null, null);

insert into parcel_crop_history (parcel_id, crop_id, season_year) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 2024),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2025),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 2024),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 2025);

-- --- Leases (one expiring within 60 days of 2026-06-08, one expired) --------
insert into leases (parcel_id, owner_name, owner_id_code, contract_number, start_date, expiry_date, payment_method, payment_status, amount) values
  ('c0000000-0000-0000-0000-000000000001', 'Ionescu Vasile', '1700101000000', 'ARZ-2021-12', '2021-07-05', '2026-07-05', 'in_kind', 'unpaid', null),
  ('c0000000-0000-0000-0000-000000000002', 'Popescu Maria', '2680202000000', 'ARZ-2019-03', '2019-03-01', '2026-03-01', 'cash', 'paid', 12000),
  ('c0000000-0000-0000-0000-000000000003', 'SC AgroTeren SRL', 'RO12345678', 'ARZ-2022-50', '2022-05-01', '2027-05-01', 'cash', 'unpaid', 25000);

-- --- Storage facilities -----------------------------------------------------
insert into storage_facilities (id, name, property_id, max_capacity_ton) values
  ('d0000000-0000-0000-0000-000000000001', 'Siloz 1', 'b0000000-0000-0000-0000-000000000001', 5000),
  ('d0000000-0000-0000-0000-000000000002', 'Magazia A', 'b0000000-0000-0000-0000-000000000005', 2000),
  ('d0000000-0000-0000-0000-000000000003', 'Siloz 2', null, 3000);

-- --- Stock transactions (trigger maintains current_load_ton) ----------------
insert into stock_transactions (facility_id, crop_id, txn_type, quantity_ton, txn_date, created_by) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'in', 3250, '2026-06-01', '11111111-1111-1111-1111-111111111111'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'in', 1500, '2026-06-02', '11111111-1111-1111-1111-111111111111'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'in', 900, '2026-06-03', '11111111-1111-1111-1111-111111111111'),
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'out', 250, '2026-06-05', '11111111-1111-1111-1111-111111111111');

-- --- Yard trucks (across the four statuses) ---------------------------------
insert into yard_trucks (plate_number, driver, cargo_crop_id, gross_weight, tare_weight, direction, status, facility_id) values
  ('B-123-ATG', 'Gheorghe Pop', 'a0000000-0000-0000-0000-000000000001', 38000, 14000, 'inbound', 'scale', 'd0000000-0000-0000-0000-000000000001'),
  ('CJ-45-XYZ', 'Ion Marin', 'a0000000-0000-0000-0000-000000000002', null, 12000, 'inbound', 'gate', null),
  ('TM-99-ABC', 'Vasile Dinu', 'a0000000-0000-0000-0000-000000000003', 41000, 15000, 'inbound', 'dock', 'd0000000-0000-0000-0000-000000000003'),
  ('B-777-FRM', 'Andrei Luca', 'a0000000-0000-0000-0000-000000000001', 40000, 13500, 'outbound', 'exited', 'd0000000-0000-0000-0000-000000000001');

-- --- AISM Faza 1: controlled lists + example dossiers -----------------------
-- Land categories (OQ-22)
insert into land_categories (code, name, name_en) values
  ('arabil', 'Arabil', 'Arable'),
  ('padure', 'Pădure', 'Forest')
on conflict (code) do nothing;

-- Document types (OQ-24, taxonomy from spec 7.4)
insert into document_types (code, name, name_en, sort_order) values
  ('antecontract', 'Antecontract de vânzare-cumpărare', 'Pre-sale agreement', 10),
  ('cvc', 'Contract de vânzare-cumpărare', 'Sale-purchase contract', 20),
  ('tp', 'Titlu de proprietate', 'Property title', 30),
  ('cf', 'Extras / Carte funciară', 'Land registry extract', 40),
  ('cadastral', 'Documente cadastrale', 'Cadastral documents', 50),
  ('identitate', 'Acte de identificare personală', 'Personal ID documents', 60),
  ('succesiune', 'Documente de succesiune / testament', 'Succession / will', 70),
  ('olografa', 'Declarație olografă', 'Holographic declaration', 80)
on conflict (code) do nothing;

-- Example dossiers (acceptance fixtures: 101, 118, 940)
insert into dossiers (dossier_number, acquisition_date, original_holder, intabulare_status) values
  ('101', '2006-05-15', 'Kovacs Barna Stefan', 'intabulat'),
  ('118', '2006-05-18', 'Simonca Gheorghe', 'intabulat_cu_posesie'),
  ('940', '2007-06-26', 'Nagy Margareta-Terezia', 'intabulat')
on conflict (dossier_number) do nothing;
