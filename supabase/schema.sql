-- Thailand Travel Map v2 schema (Supabase/Postgres)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.visited_places (user_id uuid references auth.users(id) on delete cascade, place_id text not null, created_at timestamptz default now(), primary key(user_id,place_id));
create table if not exists public.wishlist_places (user_id uuid references auth.users(id) on delete cascade, place_id text not null, created_at timestamptz default now(), primary key(user_id,place_id));
create table if not exists public.visited_provinces (user_id uuid references auth.users(id) on delete cascade, province_id text not null, created_at timestamptz default now(), primary key(user_id,province_id));
create table if not exists public.wishlist_provinces (user_id uuid references auth.users(id) on delete cascade, province_id text not null, created_at timestamptz default now(), primary key(user_id,province_id));
create table if not exists public.trips (id text primary key, user_id uuid references auth.users(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());
create table if not exists public.journals (id text primary key, user_id uuid references auth.users(id) on delete cascade, data jsonb not null, updated_at timestamptz default now());

alter table public.profiles enable row level security;
alter table public.visited_places enable row level security;
alter table public.wishlist_places enable row level security;
alter table public.visited_provinces enable row level security;
alter table public.wishlist_provinces enable row level security;
alter table public.trips enable row level security;
alter table public.journals enable row level security;

do $$ declare t text; begin
  foreach t in array array['profiles','visited_places','wishlist_places','visited_provinces','wishlist_provinces','trips','journals'] loop
    execute format('drop policy if exists "owner_all" on public.%I',t);
    execute format('create policy "owner_all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',t);
  end loop;
end $$;
