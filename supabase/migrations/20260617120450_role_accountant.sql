-- supabase/migrations/20260617120450_role_accountant.sql
-- Its own migration so the new enum value is committed before the next migration
-- references it — Postgres cannot use a newly-added enum value in the same
-- transaction that adds it.
alter type user_role add value if not exists 'accountant';
