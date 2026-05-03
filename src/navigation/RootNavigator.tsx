import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

export default function RootNavigator() {
  const [initialising, setInitialising] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);
  const setUid = useUserStore((s) => s.setUid);
  const setName = useUserStore((s) => s.setName);
  const setPrimaryPhotoUrl = useUserStore((s) => s.setPrimaryPhotoUrl);
  const reset = useUserStore((s) => s.reset);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        setUid(s.user.id);
        fetchProfile(s.user.id);
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, primary_photo_url')
        .eq('id', userId)
        .single();

      if (data?.name) setName(data.name);
      if (data?.primary_photo_url) setPrimaryPhotoUrl(data.primary_photo_url);
    } finally {
      setInitialising(false);
    }
  };

  if (initialising) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9d3d2c" />
      </View>
    );
  }

  if (!session) return <AuthStack />;
  if (!name) return <ProfileSetupScreen />;
  return <MainStack />;
}
