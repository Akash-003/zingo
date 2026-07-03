// truecaller-auth
// -------------------------------------------------------------
// PUBLIC (deploy with --no-verify-jwt): this runs *before* the user has a
// session — it is the sign-in step itself. It bridges a Truecaller OAuth 3.0
// verification into a real Supabase session.
//
// Trust boundary: the app only forwards the opaque authorization code +
// PKCE verifier. This function re-exchanges them with Truecaller server-side
// to fetch the *verified* phone number, so a client cannot forge a phone /
// take over another user's account.
//
// Flow:
//   1. POST Truecaller token endpoint (code + verifier + client_id) -> access_token
//   2. GET  Truecaller userinfo (Bearer) -> verified phone_number + name
//   3. Deterministic identity = synthetic email tc_<digits>@zingo.truecaller
//   4. admin.createUser (idempotent; ignore "already exists")
//   5. admin.generateLink(magiclink) -> single-use email OTP
//   6. return { email, token } -> client calls supabase.auth.verifyOtp(type:'email')
//
// Request:  { authorizationCode: string, codeVerifier: string }
// Response: { email: string, token: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Truecaller OAuth 3.0 (non-EU region) endpoints — must match the region the
// Client ID was created in. Verified against the official Android OAuth flow.
const TRUECALLER_TOKEN_URL = 'https://oauth-account-noneu.truecaller.com/v1/token';
const TRUECALLER_USERINFO_URL = 'https://oauth-account-noneu.truecaller.com/v1/userinfo';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface TruecallerUserInfo {
  given_name?: string;
  family_name?: string;
  phone_number?: string; // international digits, no leading '+'
  phone_number_country_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { authorizationCode, codeVerifier } = (await req.json()) as {
      authorizationCode?: string;
      codeVerifier?: string;
    };
    if (!authorizationCode || !codeVerifier) {
      return json({ error: 'authorizationCode and codeVerifier are required' }, 400);
    }

    const clientId = Deno.env.get('TRUECALLER_CLIENT_ID');
    if (!clientId) {
      return json({ error: 'Server missing TRUECALLER_CLIENT_ID' }, 500);
    }

    // 1. Exchange the authorization code for an access token (PKCE).
    const tokenRes = await fetch(TRUECALLER_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: authorizationCode,
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) {
      return json({ error: 'Truecaller token exchange failed' }, 401);
    }
    const accessToken = (await tokenRes.json())?.access_token as string | undefined;
    if (!accessToken) {
      return json({ error: 'Truecaller returned no access token' }, 401);
    }

    // 2. Fetch the verified profile (this is the trusted phone number).
    const infoRes = await fetch(TRUECALLER_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) {
      return json({ error: 'Truecaller userinfo fetch failed' }, 401);
    }
    const info = (await infoRes.json()) as TruecallerUserInfo;

    const digits = (info.phone_number ?? '').replace(/\D/g, '');
    if (!digits) {
      return json({ error: 'Truecaller returned no phone number' }, 400);
    }
    const phone = `+${digits}`;
    const fullName = [info.given_name, info.family_name].filter(Boolean).join(' ').trim();

    // 3. Deterministic identity keyed to the verified phone — same number always
    //    maps to the same account (no duplicates on re-login).
    const email = `tc_${digits}@zingo.truecaller`;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 4. Create the user if new; ignore the "already registered" case so
    //    repeat logins reuse the existing account.
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName, phone } : { phone },
    });
    if (createError && !/already|registered|exists/i.test(createError.message)) {
      return json({ error: createError.message }, 500);
    }

    // 5. Mint a single-use OTP the client can verify into a real session.
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkError || !linkData?.properties?.email_otp) {
      return json({ error: linkError?.message ?? 'Could not generate session' }, 500);
    }

    return json({ email, token: linkData.properties.email_otp });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500);
  }
});
