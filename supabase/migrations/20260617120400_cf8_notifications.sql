-- supabase/migrations/20260617120400_cf8_notifications.sql
create type notification_type as enum ('lease_due', 'lease_overdue');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type notification_type not null,
  lease_id uuid references leases (id),
  due_date date,
  lead_days int not null default 30,
  status lease_payment_status not null default 'unpaid',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table notification_recipients (
  notification_id uuid not null references notifications (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (notification_id, profile_id)
);

alter table notifications enable row level security;
alter table notification_recipients enable row level security;

-- A user sees a notification only if they are a recipient (targeted delivery, CF-8).
create policy notifications_select on notifications for select to authenticated
  using (exists (select 1 from notification_recipients r
                 where r.notification_id = id and r.profile_id = auth.uid()));
create policy notifications_write on notifications for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
create policy nr_select on notification_recipients for select to authenticated
  using (profile_id = auth.uid() or auth_role() in ('admin', 'manager'));
create policy nr_write on notification_recipients for all to authenticated
  using (auth_role() in ('admin', 'manager')) with check (auth_role() in ('admin', 'manager'));
