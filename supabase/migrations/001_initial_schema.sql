-- GovPass - Government benefits eligibility and application tracker
-- Migration: 00001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  onboarding_completed boolean default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================================
-- HANDLE NEW USER TRIGGER
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- PROGRAMS TABLE
-- Government benefit programs (shared reference data)
-- ============================================================================
create table if not exists public.programs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  eligibility_criteria jsonb,
  application_url text,
  deadline date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_programs_is_active on public.programs(is_active);

alter table public.programs enable row level security;

-- Programs are publicly readable (reference data)
create policy "Anyone can view active programs"
  on public.programs for select
  using (true);

-- Only service role can modify programs
create policy "Service role can insert programs"
  on public.programs for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update programs"
  on public.programs for update
  using (auth.role() = 'service_role');

-- ============================================================================
-- APPLICATIONS TABLE
-- User's applications to government programs
-- ============================================================================
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  program_id uuid references public.programs on delete set null,
  program_name text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'under_review', 'approved', 'denied', 'expired')),
  submitted_at timestamptz,
  decision_at timestamptz,
  notes text,
  documents jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_applications_user_id on public.applications(user_id);
create index idx_applications_status on public.applications(status);

alter table public.applications enable row level security;

create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Push/in-app notifications for application status updates
-- ============================================================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  body text,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  is_read boolean default false,
  application_id uuid references public.applications on delete set null,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_programs_updated_at before update on public.programs
  for each row execute procedure public.update_updated_at_column();

create trigger update_applications_updated_at before update on public.applications
  for each row execute procedure public.update_updated_at_column();
