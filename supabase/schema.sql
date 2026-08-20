-- Thailand Travel Map v2 schema (Supabase/Postgres)
-- Namespaced so this app can safely share a Supabase project with other apps.

create table if not exists public.travel_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_visited_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, place_id)
);

create table if not exists public.travel_wishlist_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, place_id)
);

create table if not exists public.travel_visited_provinces (
  user_id uuid not null references auth.users(id) on delete cascade,
  province_id text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, province_id)
);

create table if not exists public.travel_wishlist_provinces (
  user_id uuid not null references auth.users(id) on delete cascade,
  province_id text not null,
  created_at timestamptz not null default now(),
  primary key(user_id, province_id)
);

create table if not exists public.travel_trips (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists travel_trips_user_id_idx on public.travel_trips(user_id);

create table if not exists public.travel_journals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists travel_journals_user_id_idx on public.travel_journals(user_id);

alter table public.travel_profiles enable row level security;
alter table public.travel_visited_places enable row level security;
alter table public.travel_wishlist_places enable row level security;
alter table public.travel_visited_provinces enable row level security;
alter table public.travel_wishlist_provinces enable row level security;
alter table public.travel_trips enable row level security;
alter table public.travel_journals enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'travel_profiles','travel_visited_places','travel_wishlist_places',
    'travel_visited_provinces','travel_wishlist_provinces','travel_trips','travel_journals'
  ] loop
    execute format('drop policy if exists "travel_owner_select" on public.%I', t);
    execute format('drop policy if exists "travel_owner_insert" on public.%I', t);
    execute format('drop policy if exists "travel_owner_update" on public.%I', t);
    execute format('drop policy if exists "travel_owner_delete" on public.%I', t);
    execute format('create policy "travel_owner_select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "travel_owner_insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "travel_owner_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "travel_owner_delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;
