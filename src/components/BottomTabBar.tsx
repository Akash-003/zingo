import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Discover: { active: 'sparkles', inactive: 'sparkles-outline' },
  Create: { active: 'add-circle', inactive: 'add-circle-outline' },
  Collections: { active: 'library', inactive: 'library-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const rawLabel = options.tabBarLabel;
        const label = typeof rawLabel === 'string' ? rawLabel : route.name;
        const isActive = state.index === index;
        const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? icons.active : icons.inactive}
              size={22}
              color={isActive ? '#9d3d2c' : '#89726d'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fills the rectangular footprint so Android's black window background
  // doesn't show through the transparent corners of the rounded container.
  wrapper: {
    backgroundColor: '#fcf9f4',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    gap: 3,
  },
  activeTab: {
    backgroundColor: '#f0ede9',
  },
  label: {
    fontSize: 10,
    color: '#89726d',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#9d3d2c',
    fontWeight: '600',
  },
});
