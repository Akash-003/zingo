-- Onboarding funnel events (app_open, login_started) fire before any auth
-- session exists, so uid must be nullable and the anon role must be able to
-- insert. Anonymous rows carry a device_id inside properties for funnel joins.
-- ponytail: anon inserts are spammable with the public key; acceptable for
-- low-stakes analytics — add rate limiting only if the table ever gets abused.

alter table public.analytics_events alter column uid drop not null;

drop policy "insert own events" on public.analytics_events;

create policy "insert own events"
  on public.analytics_events
  for insert
  with check (uid is null or uid = auth.uid());
