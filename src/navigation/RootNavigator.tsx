import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { getAnalytics, setUserId } from '@react-native-firebase/analytics';

import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';
import { useUserProfile } from '../hooks/useUserProfile';
import { registerForPushNotifications } from '../services/notifications';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import LanguageSelectScreen from '../screens/auth/LanguageSelectScreen';

export default function RootNavigator() {
  const [initialising, setInitialising] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [languagePicked, setLanguagePicked] = useState(false);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);
  const setUid = useUserStore((s) => s.setUid);
  const reset = useUserStore((s) => s.reset);
  const { fetchProfile } = useUserProfile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        // Align GA4 user-scoped reports with Supabase uid.
        setUserId(getAnalytics(), s?.user?.id ?? null).catch(() => {});
        if (s?.user) {
          setUid(s.user.id);
          void registerForPushNotifications(s.user.id);
          fetchProfile(s.user.id).finally(() => setInitialising(false));
        } else {
          reset();
          setInitialising(false);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  if (initialising) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#9d3d2c" />
      </View>
    );
  }

  if (!session) return <AuthStack />;
  if (!name) {
    if (!languagePicked) return <LanguageSelectScreen onContinue={() => setLanguagePicked(true)} />;
    return <ProfileSetupScreen />;
  }
  return <MainTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
