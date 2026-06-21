// razorpay-webhook
// -------------------------------------------------------------
// Public endpoint (no Supabase JWT). Razorpay calls this on
// subscription lifecycle events. Verifies the webhook signature and
// keeps profiles.is_premium / premium_expiry in sync.
//
// Configure in Razorpay dashboard → Webhooks with the events:
//   subscription.charged, subscription.halted,
//   subscription.cancelled, subscription.completed
//
// NOTE: this function must be deployed with --no-verify-jwt so Razorpay
// can reach it without a Supabase auth token:
//   supabase functions deploy razorpay-webhook --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  RAZORPAY_WEBHOOK_SECRET,
  hmacSha256Hex,
  safeEqual,
} from '../_shared/razorpay.ts';

interface WebhookSubscriptionEntity {
  id: string;
  current_end: number | null;
}

interface WebhookPayload {
  event: string;
  payload?: {
    subscription?: { entity?: WebhookSubscriptionEntity };
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Verify signature against the RAW body before parsing.
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const expected = await hmacSha256Hex(rawBody, RAZORPAY_WEBHOOK_SECRET);
    if (!signature || !safeEqual(expected, signature)) {
      return new Response('Invalid signature', { status: 400 });
    }

    const body = JSON.parse(rawBody) as WebhookPayload;
    const subEntity = body.payload?.subscription?.entity;
    if (!subEntity) {
      // Not a subscription event we care about — acknowledge anyway.
      return new Response('ok', { status: 200 });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find which user this subscription belongs to.
    const { data: subRow } = await adminClient
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', subEntity.id)
      .single();

    const periodEnd = subEntity.current_end
      ? new Date(subEntity.current_end * 1000).toISOString()
      : null;

    let status: string;
    let isPremium: boolean;
    switch (body.event) {
      case 'subscription.charged':
        status = 'active';
        isPremium = true;
        break;
      case 'subscription.halted':
      case 'subscription.cancelled':
      case 'subscription.completed':
        status = body.event.replace('subscription.', '');
        isPremium = false;
        break;
      default:
        return new Response('ok', { status: 200 });
    }

    await adminClient
      .from('subscriptions')
      .update({ status, current_period_end: periodEnd })
      .eq('razorpay_subscription_id', subEntity.id);

    if (subRow?.user_id) {
      await adminClient
        .from('profiles')
        .update({ is_premium: isPremium, premium_expiry: periodEnd })
        .eq('id', subRow.user_id);
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
});
