import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import CardReviewScreen from '../screens/admin/CardReviewScreen';
import NameSlotAdjustScreen from '../screens/admin/NameSlotAdjustScreen';
import PhotoSlotAdjustScreen from '../screens/admin/PhotoSlotAdjustScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="CardReview" component={CardReviewScreen} />
      <Stack.Screen name="NameSlotAdjust" component={NameSlotAdjustScreen} />
      <Stack.Screen name="PhotoSlotAdjust" component={PhotoSlotAdjustScreen} />
    </Stack.Navigator>
  );
}
