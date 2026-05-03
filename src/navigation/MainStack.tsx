import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FeedScreen from '../screens/main/FeedScreen';
import CreateScreen from '../screens/main/CreateScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

export type MainStackParamList = {
  Feed: undefined;
  Create: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="Create" component={CreateScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
