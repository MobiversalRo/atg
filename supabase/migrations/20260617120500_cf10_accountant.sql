-- supabase/migrations/20260617120500_cf10_accountant.sql
-- Accountants manage lease billing (payment status) in addition to read-all.
drop policy if exists leases_insert on leases;
drop policy if exists leases_update on leases;
create policy leases_insert on leases for insert to authenticated
  with check (auth_role() in ('admin', 'manager', 'accountant'));
create policy leases_update on leases for update to authenticated
  using (auth_role() in ('admin', 'manager', 'accountant'))
  with check (auth_role() in ('admin', 'manager', 'accountant'));

-- Notifications: admins/managers manage all; recipients (incl. accountants) may
-- update their own (mark read).
drop policy if exists notifications_write on notifications;
create policy notifications_mgr_write on notifications for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
create policy notifications_recipient_update on notifications for update to authenticated
  using (exists (select 1 from notification_recipients r
                 where r.notification_id = id and r.profile_id = auth.uid()))
  with check (true);
