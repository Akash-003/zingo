// Shared Razorpay helpers for Edge Functions.
//
// Secrets are read from the Edge Function environment — set them with:
//   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... \
//     RAZORPAY_WEBHOOK_SECRET=...
// They must NEVER be shipped in the app bundle.

export const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
export const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
export const RAZORPAY_WEBHOOK_SECRET =
  Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function basicAuthHeader(): string {
  const token = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  return `Basic ${token}`;
}

export interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null; // unix seconds
}

export async function createRazorpaySubscription(
  planId: string,
  totalCount: number,
): Promise<RazorpaySubscription> {
  const res = await fetch(`${RAZORPAY_API}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: totalCount,
      customer_notify: 1,
      quantity: 1,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay create subscription failed: ${detail}`);
  }
  return (await res.json()) as RazorpaySubscription;
}

export async function fetchRazorpaySubscription(
  subscriptionId: string,
): Promise<RazorpaySubscription> {
  const res = await fetch(`${RAZORPAY_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: basicAuthHeader() },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay fetch subscription failed: ${detail}`);
  }
  return (await res.json()) as RazorpaySubscription;
}

// HMAC-SHA256 hex digest of `message` keyed by `secret`.
export async function hmacSha256Hex(
  message: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time string comparison to avoid timing attacks.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
