import { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuoteCard from '../../components/cards/QuoteCard';
import ActionButtons from '../../components/ActionButtons';
import CategoryChips from '../../components/CategoryChips';
import { useCards } from '../../hooks/useCards';
import { useCardCapture } from '../../hooks/useCardCapture';
import { shareCard, downloadCard } from '../../services/sharing';
import { useCardsStore, Card } from '../../store/cardsStore';
import { useUserStore } from '../../store/userStore';

interface CardItemProps {
  card: Card;
  itemWidth: number;
}

function CardItem({ card, itemWidth }: CardItemProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const cardRef = useRef<View>(null);
  const { capture } = useCardCapture();
  const isPremium = useUserStore((s) => s.isPremium);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);
  const user = { primaryPhotoUrl, name };

  const captureAndRun = async (action: (uri: string) => Promise<void>) => {
    try {
      setActionLoading(true);
      const uri = await capture(cardRef);
      await action(uri);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => captureAndRun(shareCard);
  const handleDownload = () => captureAndRun(downloadCard);

  const handleChangePhoto = () =>
    Alert.alert('Change Photo', 'Photo management coming in the next update.');
  const handleEditName = () =>
    Alert.alert('Edit Name', 'Name editing coming in the next update.');

  return (
    <View style={[styles.cardItem, { width: itemWidth }]}>
      <QuoteCard
        card={card}
        user={user}
        cardRef={cardRef}
        showWatermark={!isPremium}
      />
      <ActionButtons
        onShare={handleShare}
        onDownload={handleDownload}
        onChangePhoto={handleChangePhoto}
        onEditName={handleEditName}
        loading={actionLoading}
      />
    </View>
  );
}

// ActionButtons renders: paddingTop(20) + button(44) + paddingBottom(16) = 80px
const ACTION_BUTTONS_HEIGHT = 80;
// Gap between cards in feedContent
const FEED_GAP = 48;
// Top padding of feedContent
const FEED_PADDING_TOP = 12;

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const itemWidth = width - 32;

  const cards = useCardsStore((s) => s.cards);
  const currentCategory = useCardsStore((s) => s.currentCategory);
  const setCurrentCategory = useCardsStore((s) => s.setCurrentCategory);
  const { loading, hasMore, fetchMore } = useCards();
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);


  const cardHeight = itemWidth * (3 / 2);
  const slotHeight = cardHeight + ACTION_BUTTONS_HEIGHT + FEED_GAP;
  const snapOffsets = cards.map((_, i) => i * slotHeight);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>CREATE</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          {primaryPhotoUrl ? (
            <Image source={{ uri: primaryPhotoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <CategoryChips selected={currentCategory} onSelect={setCurrentCategory} />

      {/* Feed */}
      {loading && cards.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#9d3d2c" />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No cards in this category yet.</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CardItem card={item} itemWidth={itemWidth} />}

          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          snapToOffsets={snapOffsets}
          snapToAlignment="start"
          decelerationRate="fast"
          onEndReached={() => { if (hasMore && !loading) fetchMore(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loading && cards.length > 0 ? (
              <ActivityIndicator color="#9d3d2c" style={styles.footerLoader} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8e3',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f3ee',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.3)',
  },
  searchIcon: {
    fontSize: 16,
    color: '#89726d',
  },
  searchPlaceholder: {
    fontSize: 14,
    color: '#89726d',
  },
  createBtn: {
    borderWidth: 1,
    borderColor: '#89726d',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: 1.2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.3)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#f0ede9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9d3d2c',
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: FEED_PADDING_TOP,
    paddingBottom: ACTION_BUTTONS_HEIGHT + 4,
    gap: 48,
    backgroundColor: '#fcf9f4',
  },
  cardItem: {
    // width set dynamically
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcf9f4',
  },
  emptyText: {
    fontSize: 15,
    color: '#56423e',
  },
  footerLoader: {
    marginVertical: 24,
  },
});
