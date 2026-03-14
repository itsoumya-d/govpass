-- Add expo_push_token to profiles for push notification targeting
-- Migration: push_tokens

alter table public.profiles
  add column if not exists expo_push_token text,
  add column if not exists push_notifications_enabled boolean not null default true;

-- Index for efficient push token lookup
create index if not exists idx_profiles_push_token
  on public.profiles (expo_push_token)
  where expo_push_token is not null;

-- Store push token delivery history (optional analytics)
create table if not exists public.push_notifications_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  type          text not null,
  title         text not null,
  body          text not null,
  expo_ticket_id text,
  status        text not null default 'sent' check (status in ('sent','delivered','failed','not_registered')),
  sent_at       timestamptz not null default now()
);

-- RLS on log: users see their own notifications
alter table public.push_notifications_log enable row level security;
create policy "users_own_push_log" on public.push_notifications_log
  for select using (auth.uid() = user_id);

-- Auto-purge old logs after 30 days (cleanup trigger)
create or replace function public.cleanup_old_push_logs()
returns void language sql security definer as $$
  delete from public.push_notifications_log
  where sent_at < now() - interval '30 days';
$$;
