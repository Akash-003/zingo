import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import RootNavigator from './src/navigation/RootNavigator';
import AppAlert from './src/components/AppAlert';
import BrandSplash from './src/components/BrandSplash';

// Keep the native system splash up until <BrandSplash> mounts and takes over,
// so there's no blank flash between the OS splash and the in-app lockup.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [brandSplashDone, setBrandSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#fcf9f4" />
        <RootNavigator />
      </NavigationContainer>
      <AppAlert />
      {!brandSplashDone && <BrandSplash onFinish={() => setBrandSplashDone(true)} />}
    </SafeAreaProvider>
  );
}
