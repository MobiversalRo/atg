-- Req 4: operators may edit document metadata (file stays immutable — no delete policy).
drop policy if exists documents_update on documents;
create policy documents_update on documents for update to authenticated
  using (auth_role() in ('admin', 'manager', 'operator'))
  with check (auth_role() in ('admin', 'manager', 'operator'));

-- Req 6: any uploader may create a new document type on the fly.
create policy document_types_insert on document_types for insert to authenticated
  with check (auth_role() in ('admin', 'manager', 'operator'));
