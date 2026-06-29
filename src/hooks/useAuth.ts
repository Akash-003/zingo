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

  const signOut = async () => {
    // Clear the cached Google account so the next sign-in shows the picker.
    await GoogleSignin.signOut().catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { signInWithGoogle, signInAsGuest, signOut };
}
