import Constants from 'expo-constants';
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from './supabase';

export interface Plan {
  razorpayPlanId: string;
  label: string;
  period: string;
  amountDisplay: string;
}

interface PlanRow {
  razorpay_plan_id: string;
  label: string;
  period: string;
  amount_display: string;
}

interface CreateSubscriptionResponse {
  subscription_id: string;
  key_id: string;
}

// What Razorpay's native checkout resolves with for a subscription.
interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface SubscriptionResult {
  success: boolean;
  cancelled?: boolean;
}

const { RAZORPAY_KEY_ID } = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string
>;

/** Loads the active subscription plans you configured on Razorpay. */
export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('razorpay_plan_id, label, period, amount_display')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data as PlanRow[] | null) ?? []).map((row) => ({
    razorpayPlanId: row.razorpay_plan_id,
    label: row.label,
    period: row.period,
    amountDisplay: row.amount_display,
  }));
}

/**
 * Runs the full subscribe flow:
 *   1. create-subscription Edge Function (holds the Razorpay secret)
 *   2. native Razorpay checkout
 *   3. verify-payment Edge Function (verifies signature, flips premium)
 * Returns { success } — `cancelled: true` when the user dismissed checkout.
 */
export async function startSubscription(
  razorpayPlanId: string,
  prefill?: { name?: string; email?: string; contact?: string },
): Promise<SubscriptionResult> {
  const { data, error } = await supabase.functions.invoke<CreateSubscriptionResponse>(
    'create-subscription',
    { body: { razorpay_plan_id: razorpayPlanId } },
  );
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not start subscription');
  }

  let checkout: RazorpaySuccess;
  try {
    checkout = (await RazorpayCheckout.open({
      key: data.key_id ?? RAZORPAY_KEY_ID,
      subscription_id: data.subscription_id,
      name: 'QuoteFlow Premium',
      description: 'Unlimited personalized sharing & downloads',
      prefill,
      theme: { color: '#9d3d2c' },
    })) as RazorpaySuccess;
  } catch {
    // User dismissed or payment failed at the checkout sheet.
    return { success: false, cancelled: true };
  }

  const { error: verifyError } = await supabase.functions.invoke(
    'verify-payment',
    {
      body: {
        razorpay_payment_id: checkout.razorpay_payment_id,
        razorpay_subscription_id: checkout.razorpay_subscription_id,
        razorpay_signature: checkout.razorpay_signature,
      },
    },
  );
  if (verifyError) {
    throw new Error(verifyError.message ?? 'Payment verification failed');
  }

  return { success: true };
}
