import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from '../screens/main/FeedScreen';
import CreateScreen from '../screens/main/CreateScreen';
import CollectionsScreen from '../screens/main/CollectionsScreen';
import ProfileStack from './ProfileStack';
import BottomTabBar from '../components/BottomTabBar';
import { t } from '../i18n';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      backBehavior="firstRoute"
    >
      <Tab.Screen name="Discover" component={FeedScreen} options={{ tabBarLabel: t('tab.discover') }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ tabBarLabel: t('tab.create') }} />
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ tabBarLabel: t('tab.collections') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: t('tab.profile') }} />
    </Tab.Navigator>
  );
}
