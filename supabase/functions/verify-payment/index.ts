// verify-payment
// -------------------------------------------------------------
// Authenticated. Verifies the Razorpay checkout signature and, on
// success, flips the user's premium flag server-side.
//
// Request:  {
//   razorpay_payment_id: string,
//   razorpay_subscription_id: string,
//   razorpay_signature: string,
// }
// Response: { success: true, premium_expiry: string | null }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  RAZORPAY_KEY_SECRET,
  fetchRazorpaySubscription,
  hmacSha256Hex,
  safeEqual,
} from '../_shared/razorpay.ts';

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

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = (await req.json()) as {
      razorpay_payment_id?: string;
      razorpay_subscription_id?: string;
      razorpay_signature?: string;
    };
    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return json({ error: 'Missing payment fields' }, 400);
    }

    // Razorpay subscription signature: HMAC of `payment_id|subscription_id`.
    const expected = await hmacSha256Hex(
      `${razorpay_payment_id}|${razorpay_subscription_id}`,
      RAZORPAY_KEY_SECRET,
    );
    if (!safeEqual(expected, razorpay_signature)) {
      return json({ error: 'Signature verification failed' }, 400);
    }

    // Authoritative period end comes from Razorpay, not the client.
    const subscription = await fetchRazorpaySubscription(
      razorpay_subscription_id,
    );
    const premiumExpiry = subscription.current_end
      ? new Date(subscription.current_end * 1000).toISOString()
      : null;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await adminClient
      .from('profiles')
      .update({ is_premium: true, premium_expiry: premiumExpiry })
      .eq('id', user.id);

    await adminClient
      .from('subscriptions')
      .update({ status: 'active', current_period_end: premiumExpiry })
      .eq('razorpay_subscription_id', razorpay_subscription_id);

    return json({ success: true, premium_expiry: premiumExpiry });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
