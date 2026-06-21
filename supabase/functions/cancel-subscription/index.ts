// cancel-subscription
// -------------------------------------------------------------
// Authenticated. Cancels the caller's Razorpay subscription at the end of
// the current billing cycle (they keep premium until then). Flags the local
// row so the app can show an "active but won't renew" state; the
// razorpay-webhook flips is_premium=false when `subscription.cancelled`
// arrives at period end.
//
// Request:  { razorpay_subscription_id: string }
// Response: { success: true, current_period_end: string | null }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { cancelRazorpaySubscription } from '../_shared/razorpay.ts';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

    // Client scoped to the caller's JWT — used only to identify the user.
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { razorpay_subscription_id } = (await req.json()) as {
      razorpay_subscription_id?: string;
    };
    if (!razorpay_subscription_id) {
      return json({ error: 'razorpay_subscription_id is required' }, 400);
    }

    // Service-role client bypasses RLS for the ownership check + update.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Ownership gate: never cancel a subscription the caller doesn't own.
    const { data: subRow } = await adminClient
      .from('subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', razorpay_subscription_id)
      .single();
    if (!subRow || subRow.user_id !== user.id) {
      return json({ error: 'Subscription not found' }, 403);
    }

    const subscription = await cancelRazorpaySubscription(
      razorpay_subscription_id,
      true,
    );

    const periodEnd = subscription.current_end
      ? new Date(subscription.current_end * 1000).toISOString()
      : null;

    await adminClient
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('razorpay_subscription_id', razorpay_subscription_id);

    return json({ success: true, current_period_end: periodEnd });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
