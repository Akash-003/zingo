import { useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoryLabel } from '../i18n';
import { useLanguageStore } from '../store/languageStore';

const CATEGORY_IDS = [
  'all',
  'good-morning',
  'motivational',
  'love',
  'birthday',
  'good-night',
  'festivals',
  'shayari',
  'devotional',
  'friendship',
  'life',
];

// Recomputed (not a module-level constant) so it picks up an in-app language
// change without needing an app restart — see src/store/languageStore.ts.
export function useCategories() {
  useLanguageStore((s) => s.language);
  return CATEGORY_IDS.map((id) => ({ id, label: categoryLabel(id) }));
}

// Distance (px) scrolled past an edge before its fade affordance appears.
const EDGE_THRESHOLD = 4;

interface CategoryChipsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const categories = useCategories();
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    setShowLeftFade(contentOffset.x > EDGE_THRESHOLD);
    setShowRightFade(contentOffset.x < maxScroll - EDGE_THRESHOLD);
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={categories}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const isActive = item.id === selected;
          return (
            <TouchableOpacity
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                {item.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {showLeftFade && (
        <LinearGradient
          colors={['#ffffff', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, styles.fadeLeft]}
          pointerEvents="none"
        />
      )}
      {showRightFade && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fade, styles.fadeRight]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8e3',
  },
  list: {
    // Extra right padding lets the next chip "peek" past the fade so users
    // sense there's more to scroll.
    paddingLeft: 16,
    paddingRight: 28,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#9d3d2c',
    borderColor: '#9d3d2c',
  },
  chipInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#89726d',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipTextInactive: {
    color: '#56423e',
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 1, // sit above the 1px bottom border
    width: 36,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
});
