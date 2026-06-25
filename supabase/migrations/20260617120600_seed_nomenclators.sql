-- supabase/migrations/20260617120600_seed_nomenclators.sql
-- Controlled-list reference data (CF-1 / OQ-22, OQ-24). Unlike the example
-- dossiers and dev logins (which stay in seed.sql for local dev only), these
-- nomenclators are real reference data that must exist in every environment,
-- so they ship as a migration. Idempotent.

insert into land_categories (code, name, name_en) values
  ('arabil', 'Arabil', 'Arable'),
  ('padure', 'Pădure', 'Forest')
on conflict (code) do nothing;

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
