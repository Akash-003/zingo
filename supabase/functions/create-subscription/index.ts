// create-subscription
// -------------------------------------------------------------
// Authenticated. Creates a Razorpay subscription for the given plan
// and records a pending row in `subscriptions`.
//
// Request:  { razorpay_plan_id: string, total_count?: number }
// Response: { subscription_id: string, key_id: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  RAZORPAY_KEY_ID,
  createRazorpaySubscription,
} from '../_shared/razorpay.ts';

// Default billing cycles when the client doesn't specify one.
const DEFAULT_TOTAL_COUNT = 120;

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

    const { razorpay_plan_id, total_count } = (await req.json()) as {
      razorpay_plan_id?: string;
      total_count?: number;
    };
    if (!razorpay_plan_id) {
      return json({ error: 'razorpay_plan_id is required' }, 400);
    }

    const subscription = await createRazorpaySubscription(
      razorpay_plan_id,
      total_count ?? DEFAULT_TOTAL_COUNT,
    );

    // Service-role client bypasses RLS to record subscription state.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    await adminClient.from('subscriptions').insert({
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id,
      status: subscription.status,
    });

    return json({ subscription_id: subscription.id, key_id: RAZORPAY_KEY_ID });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
