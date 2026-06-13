import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';

interface CollectionCard {
  id: string;
  imageUrl: string;
  category: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'good-morning': 'Good Morning',
  motivational: 'Motivational',
  love: 'Love',
  birthday: 'Birthday',
  'good-night': 'Good Night',
  festivals: 'Festivals',
  shayari: 'Shayari',
  devotional: 'Devotional',
  friendship: 'Friendship',
  life: 'Life',
};

export default function CollectionsScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const uid = useUserStore((s) => s.uid);

  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);

  const COLUMN_GAP = 12;
  const PADDING_H = 16;
  const itemWidth = (width - PADDING_H * 2 - COLUMN_GAP) / 2;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('cards')
      .select('id, image_url, category, created_at')
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCards(
          (data ?? []).map((row) => ({
            id: row.id as string,
            imageUrl: row.image_url as string,
            category: row.category as string | null,
            createdAt: row.created_at as string,
          }))
        );
        setLoading(false);
      });
  }, [uid]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
        {cards.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{cards.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9d3d2c" />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={56} color="#c8b5af" />
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            {"Tap + to create your first card"}
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Create' as never)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create a Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { width: itemWidth }]}>
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.cardImage, { width: itemWidth, height: itemWidth * 1.5 }]}
                resizeMode="cover"
              />
              {item.category != null && (
                <View style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fcf9f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8e3',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c19',
  },
  countBadge: {
    backgroundColor: '#f0ede9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9d3d2c',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c19',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#89726d',
    textAlign: 'center',
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9d3d2c',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0ede9',
  },
  cardImage: {
    borderRadius: 12,
  },
  chip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
