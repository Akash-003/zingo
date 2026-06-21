-- ============================================================
-- QuoteFlow — Razorpay Subscriptions
-- ============================================================
-- Adds:
--   subscription_plans  — configurable catalogue of the plans you
--                         created on Razorpay (drives the paywall UI).
--   subscriptions       — per-user subscription state (written only
--                         by Edge Functions via the service-role key).
--
-- Premium itself lives on profiles.is_premium / profiles.premium_expiry
-- (already created in 20250412000001_init_schema.sql). Those columns are
-- flipped server-side by the verify-payment and razorpay-webhook
-- Edge Functions — never by the client.
-- ============================================================

-- ── subscription_plans ───────────────────────────────────────
-- One row per Razorpay plan. amount_display is the human-readable
-- label the paywall renders (kept in sync with Razorpay by you).
create table public.subscription_plans (
  id               uuid primary key default gen_random_uuid(),
  razorpay_plan_id text not null unique,
  label            text not null,            -- e.g. 'Weekly', 'Monthly'
  period           text not null,            -- e.g. 'weekly', 'monthly'
  amount_display   text not null,            -- e.g. '₹99 / month'
  sort_order       int  not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index subscription_plans_active_idx
  on public.subscription_plans (is_active, sort_order);

-- ── subscriptions ────────────────────────────────────────────
-- Audit/state of each user's Razorpay subscription.
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  razorpay_subscription_id text not null unique,
  razorpay_plan_id        text not null,
  status                  text not null default 'created',
  current_period_end      timestamptz,
  created_at              timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;

-- subscription_plans: anyone (incl. anonymous) can read active plans.
-- No client writes — you manage plans via SQL / the dashboard.
create policy "subscription_plans: public read active"
  on public.subscription_plans for select
  using (is_active = true);

-- subscriptions: owner can read their own rows. No client writes;
-- Edge Functions use the service-role key, which bypasses RLS.
create policy "subscriptions: owner read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ── Seed your plans here ──────────────────────────────────────
-- Create the plans in the Razorpay dashboard first, then paste their
-- plan IDs below and uncomment. Edit amount_display to match.
--
-- insert into public.subscription_plans
--   (razorpay_plan_id, label, period, amount_display, sort_order)
-- values
--   ('plan_XXXXXXXXXXXXXX', 'Weekly',  'weekly',  '₹29 / week',  1),
--   ('plan_YYYYYYYYYYYYYY', 'Monthly', 'monthly', '₹99 / month', 2);
