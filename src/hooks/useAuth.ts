import Constants from 'expo-constants';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../services/supabase';

// Web client ID is the audience of the ID token Supabase verifies — NOT the
// Android client ID (that one just authorizes the SHA-1 to mint the token).
GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID,
});

export function useAuth() {
  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    try {
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('Google sign-in returned no ID token');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } catch (e) {
      // User dismissing the picker is not an error — swallow it.
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return;
      throw e;
    }
  };

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  // The native Truecaller flow (which yields the authorization code + PKCE
  // verifier) runs in WelcomeScreen via the useTruecaller hook; this just
  // bridges that result into a Supabase session. The Edge Function re-verifies
  // the code with Truecaller server-side and returns a single-use OTP we
  // exchange for a real session.
  const signInWithTruecaller = async (oauth: {
    authorizationCode: string;
    codeVerifier: string;
  }) => {
    const { data, error } = await supabase.functions.invoke('truecaller-auth', {
      body: oauth,
    });
    if (error) throw error;
    const { email, token } = (data ?? {}) as { email?: string; token?: string };
    if (!email || !token) throw new Error('Truecaller sign-in failed');
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (otpError) throw otpError;
  };

  const signOut = async () => {
    // Clear the cached Google account so the next sign-in shows the picker.
    await GoogleSignin.signOut().catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { signInWithGoogle, signInAsGuest, signInWithTruecaller, signOut };
}
