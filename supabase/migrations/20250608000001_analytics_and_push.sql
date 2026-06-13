-- Analytics events table
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  uid         uuid not null references auth.users(id) on delete cascade,
  event_name  text not null,
  properties  jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- Index for per-user event queries
create index if not exists analytics_events_uid_idx on public.analytics_events(uid);
-- Index for event funnel queries
create index if not exists analytics_events_name_idx on public.analytics_events(event_name);

-- RLS: users can only insert their own events; no reads from client
alter table public.analytics_events enable row level security;

create policy "insert own events"
  on public.analytics_events
  for insert
  with check (uid = auth.uid());

-- Push token column on profiles (nullable — only present after permission granted)
alter table public.profiles
  add column if not exists push_token text;
