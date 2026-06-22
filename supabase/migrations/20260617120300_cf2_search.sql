-- supabase/migrations/20260617120300_cf2_search.sql

-- Trigram indexes accelerate substring (LIKE '%x%') search across the key fields (OQ-7).
create index parcels_cf_trgm on parcels using gin (cf_current gin_trgm_ops);
create index parcels_topo_trgm on parcels using gin (topo_code gin_trgm_ops);
create index parcel_cf_aliases_trgm on parcel_cf_aliases using gin (cf_number gin_trgm_ops);
create index dossiers_holder_trgm on dossiers using gin (original_holder gin_trgm_ops);
create index dossiers_number_trgm on dossiers using gin (dossier_number gin_trgm_ops);
create index documents_number_trgm on documents using gin (document_number gin_trgm_ops);

-- Unified search. Accent-insensitive; code matches are space-tolerant (P-1: a stray
-- space in a CF/dossier number still matches); old<->new CF both resolve (P-3).
create or replace function search_all(q text)
returns table (kind text, id uuid, label text, sub text)
language sql stable security invoker
set search_path = public, extensions
as $$
  with needle as (
    select unaccent(lower(regexp_replace(q, '\s+', '', 'g'))) as n,  -- space-stripped (codes)
           unaccent(lower(trim(q))) as t                              -- trimmed (names)
  )
  select 'parcel'::text, p.id, coalesce(p.cf_current, p.topo_code), p.uat
  from parcels p, needle
  where p.archived_at is null
    and (unaccent(lower(regexp_replace(coalesce(p.cf_current,''),'\s+','','g'))) like '%'||needle.n||'%'
      or unaccent(lower(regexp_replace(coalesce(p.topo_code,''),'\s+','','g'))) like '%'||needle.n||'%')
  union all
  select 'parcel'::text, a.parcel_id, a.cf_number, 'CF vechi'::text
  from parcel_cf_aliases a, needle
  where unaccent(lower(regexp_replace(a.cf_number,'\s+','','g'))) like '%'||needle.n||'%'
  union all
  select 'dossier'::text, d.id, d.dossier_number, d.original_holder
  from dossiers d, needle
  where d.archived_at is null
    and (unaccent(lower(regexp_replace(d.dossier_number,'\s+','','g'))) like '%'||needle.n||'%'
      or unaccent(lower(coalesce(d.original_holder,''))) like '%'||needle.t||'%')
  union all
  select 'document'::text, dc.id, coalesce(dc.document_number, dc.original_filename), null::text
  from documents dc, needle
  where dc.archived_at is null
    and unaccent(lower(coalesce(dc.document_number,''))) like '%'||needle.t||'%'
  union all
  select 'lease'::text, l.id, l.owner_name, l.contract_number
  from leases l, needle
  where unaccent(lower(l.owner_name)) like '%'||needle.t||'%'
  limit 50;
$$;
