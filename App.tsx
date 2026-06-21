import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import AppAlert from './src/components/AppAlert';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#fcf9f4" />
        <RootNavigator />
      </NavigationContainer>
      <AppAlert />
    </SafeAreaProvider>
  );
}
