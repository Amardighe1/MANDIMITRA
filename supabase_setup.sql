-- =============================================================================
-- MANDIMITRA - Supabase Database Setup
-- =============================================================================
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- 1. Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  role          text not null check (role in ('farmer', 'doctor', 'admin')),
  full_name     text,
  phone         text,

  -- Doctor verification fields
  veterinary_license  text,
  veterinary_college  text,
  specialization      text,
  years_of_experience integer,
  is_verified         boolean default false,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Enable Row-Level Security
alter table public.profiles enable row level security;

-- 3. RLS Policies
-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Service role (backend) can do everything (bypasses RLS automatically)
-- Insert policy for service role / authenticated signup flow
create policy "Service role full access"
  on public.profiles for all
  using (true)
  with check (true);

-- 4. Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 5. Index for fast role lookups
create index if not exists idx_profiles_role on public.profiles(role);

-- Done!
-- The backend will auto-create the admin account on first startup.
