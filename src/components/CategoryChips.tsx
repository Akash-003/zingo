import { FlatList, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'good-morning', label: 'Good Morning' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'love', label: 'Love' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'good-night', label: 'Good Night' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'shayari', label: 'Shayari' },
  { id: 'devotional', label: 'Devotional' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'life', label: 'Life' },
];

interface CategoryChipsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <View style={styles.wrapper}>
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
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
    paddingHorizontal: 16,
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
});
