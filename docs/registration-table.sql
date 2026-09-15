-- =============================================================================
-- BeejRakshak — full Supabase schema (new project)
-- Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Safe to re-run: drops policies/trigger first, then recreates.
-- =============================================================================

-- 1. Farmers table (login: name + mobile; session stores farmer id)
create table if not exists public.farmers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null unique,
  created_at timestamptz not null default now()
);

alter table public.farmers enable row level security;

drop policy if exists "Allow all for farmers" on public.farmers;
create policy "Allow all for farmers"
  on public.farmers
  for all
  using (true)
  with check (true);

-- 2. Registrations table (profile after login; user_id = farmers.id)
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.farmers(id) on delete cascade,
  farmer_name text,
  aadhaar text not null,
  mobile text,
  preferred_language text not null,
  village text,
  district text,
  state text,
  latitude double precision,
  longitude double precision,
  land_area numeric,
  land_unit text,
  primary_crop text,
  crop_stage text,
  satellite_consent boolean not null default false,
  market_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.registrations enable row level security;

drop policy if exists "Allow all for registrations" on public.registrations;
create policy "Allow all for registrations"
  on public.registrations
  for all
  using (true)
  with check (true);

-- 3. Auto-update updated_at on registrations
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_registrations_updated_at on public.registrations;
create trigger set_registrations_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();
