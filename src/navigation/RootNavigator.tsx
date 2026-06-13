import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';
import { useUserProfile } from '../hooks/useUserProfile';
import { registerForPushNotifications } from '../services/notifications';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

export default function RootNavigator() {
  const [initialising, setInitialising] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);
  const setUid = useUserStore((s) => s.setUid);
  const reset = useUserStore((s) => s.reset);
  const { fetchProfile } = useUserProfile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
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
  if (!name) return <ProfileSetupScreen />;
  return <MainTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
