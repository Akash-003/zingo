import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';
import { useUserProfile } from '../hooks/useUserProfile';
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
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        setUid(s.user.id);
        fetchProfile(s.user.id).finally(() => setInitialising(false));
      } else {
        setInitialising(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          setUid(s.user.id);
          fetchProfile(s.user.id);
        } else {
          reset();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (initialising) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9d3d2c" />
      </View>
    );
  }

  if (!session) return <AuthStack />;
  if (!name) return <ProfileSetupScreen />;
  return <MainTabs />;
}
