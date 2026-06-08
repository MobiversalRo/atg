-- User roles and the profile row that mirrors each auth user.
create type user_role as enum ('admin', 'manager', 'operator');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role user_role not null default 'operator',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Create a profile automatically when a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
