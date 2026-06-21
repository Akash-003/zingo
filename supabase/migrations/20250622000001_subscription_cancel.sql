-- ============================================================
-- QuoteFlow — Subscription cancellation
-- ============================================================
-- Adds a flag so the app can show an "active but won't renew"
-- state after a user cancels. We cancel at the end of the paid
-- period (Razorpay cancel_at_cycle_end=1), so the subscription
-- stays `active` until Razorpay fires `subscription.cancelled`
-- at period end; until then this flag drives the UI copy.
-- ============================================================

alter table public.subscriptions
  add column cancel_at_period_end boolean not null default false;
