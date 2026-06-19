-- supabase/migrations/20260617120200_cf4_protection.sql
-- CF-4 (client's #1 priority): documents, dossiers, parcels and CF aliases
-- can never be hard-deleted. Mistakes are handled by admin-only soft archive.

-- parcels already has _delete from the MVP RLS loop; drop it.
drop policy if exists parcels_delete on parcels;

-- Protected tables: read all, insert/update by admin+manager, NO delete for anyone.
do $$
declare t text;
begin
  foreach t in array array['dossiers', 'documents', 'parcel_cf_aliases'] loop
    execute format('create policy %I on %I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on %I for insert to authenticated with check (auth_role() in (''admin'',''manager''))', t || '_insert', t);
    execute format('create policy %I on %I for update to authenticated using (auth_role() in (''admin'',''manager'')) with check (auth_role() in (''admin'',''manager''))', t || '_update', t);
    -- Intentionally NO delete policy => delete denied by RLS for every role.
  end loop;
end;
$$;

-- Operators may upload documents (CF-3) even though they cannot edit parcels.
drop policy if exists documents_insert on documents;
create policy documents_insert on documents for insert to authenticated
  with check (auth_role() in ('admin', 'manager', 'operator'));
