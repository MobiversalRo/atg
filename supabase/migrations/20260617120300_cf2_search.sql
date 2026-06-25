-- supabase/migrations/20260617120300_cf2_search.sql

-- Unified search. Accent-insensitive; code matches are space-tolerant (P-1: a stray
-- space in a CF/dossier number still matches); old<->new CF both resolve (P-3).
-- LIKE metacharacters (% _ \) in the query are escaped so they match literally.
create or replace function search_all(q text)
returns table (kind text, id uuid, label text, sub text)
language sql stable security invoker
set search_path = public, extensions
as $$
  with needle as (
    select replace(replace(replace(unaccent(lower(regexp_replace(q, '\s+', '', 'g'))), '\', '\\'), '%', '\%'), '_', '\_') as n,
           replace(replace(replace(unaccent(lower(trim(q))), '\', '\\'), '%', '\%'), '_', '\_') as t
  )
  select 'parcel'::text, p.id, coalesce(p.cf_current, p.topo_code), p.uat
  from parcels p, needle
  where p.archived_at is null
    and (unaccent(lower(regexp_replace(coalesce(p.cf_current,''),'\s+','','g'))) like '%'||needle.n||'%' escape '\'
      or unaccent(lower(regexp_replace(coalesce(p.topo_code,''),'\s+','','g'))) like '%'||needle.n||'%' escape '\')
  union all
  select 'parcel'::text, a.parcel_id, a.cf_number, 'CF vechi'::text
  from parcel_cf_aliases a, needle
  where unaccent(lower(regexp_replace(a.cf_number,'\s+','','g'))) like '%'||needle.n||'%' escape '\'
  union all
  select 'dossier'::text, d.id, d.dossier_number, d.original_holder
  from dossiers d, needle
  where d.archived_at is null
    and (unaccent(lower(regexp_replace(d.dossier_number,'\s+','','g'))) like '%'||needle.n||'%' escape '\'
      or unaccent(lower(coalesce(d.original_holder,''))) like '%'||needle.t||'%' escape '\')
  union all
  select 'document'::text, dc.id, coalesce(dc.document_number, dc.original_filename), null::text
  from documents dc, needle
  where dc.archived_at is null
    and unaccent(lower(coalesce(dc.document_number,''))) like '%'||needle.t||'%' escape '\'
  union all
  select 'lease'::text, l.id, l.owner_name, l.contract_number
  from leases l, needle
  where unaccent(lower(l.owner_name)) like '%'||needle.t||'%' escape '\'
  limit 50;
$$;
