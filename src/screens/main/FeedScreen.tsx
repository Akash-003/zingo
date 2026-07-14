import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Keyboard,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuoteCard from '../../components/cards/QuoteCard';
import ActionButtons from '../../components/ActionButtons';
import CategoryChips, { useCategories } from '../../components/CategoryChips';
import PaywallModal from '../../components/PaywallModal';
import { useCards } from '../../hooks/useCards';
import { useCardCapture } from '../../hooks/useCardCapture';
import { useUserProfile } from '../../hooks/useUserProfile';
import { shareCard, downloadCard } from '../../services/sharing';
import { track } from '../../services/analytics';
import { useCardsStore, Card } from '../../store/cardsStore';
import { useUserStore } from '../../store/userStore';
import { showAlert } from '../../store/alertStore';
import { useProfileEditStore } from '../../store/profileEditStore';
import { t } from '../../i18n';

interface CardItemProps {
  card: Card;
  itemWidth: number;
  itemHeight: number;
}

type CardActionEvent = 'share_card' | 'download_card';

function CardItem({ card, itemWidth, itemHeight }: CardItemProps) {
  const [loadingAction, setLoadingAction] = useState<'share' | 'download' | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallContext, setPaywallContext] = useState<'share' | 'save'>('share');
  const [pendingPlainEvent, setPendingPlainEvent] = useState<CardActionEvent | null>(null);
  const cardRef = useRef<View>(null);
  const { capture } = useCardCapture();
  const { refreshProfile } = useUserProfile();
  const openNameModal = useProfileEditStore((s) => s.openNameModal);
  const openPhotoModal = useProfileEditStore((s) => s.openPhotoModal);
  const uid = useUserStore((s) => s.uid);
  const isPremium = useUserStore((s) => s.isPremium);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);
  const user = { primaryPhotoUrl, name };

  const eventForContext = (ctx: 'share' | 'save'): CardActionEvent =>
    ctx === 'share' ? 'share_card' : 'download_card';

  // Capture the given card View and run the matching share/save action.
  const runAction = async (ref: typeof cardRef, event: CardActionEvent) => {
    const action = event === 'share_card' ? shareCard : downloadCard;
    try {
      setLoadingAction(event === 'share_card' ? 'share' : 'download');
      const uri = await capture(ref);
      await action(uri);
      void track(uid, event, { card_id: card.id, category: card.category });
    } catch (err) {
      showAlert(t('common.error'), err instanceof Error ? err.message : t('common.genericError'));
    } finally {
      setLoadingAction(null);
    }
  };

  // Free users go through the paywall; premium users act directly.
  const handleShare = async () => {
    if (isPremium) {
      await runAction(cardRef, 'share_card');
      return;
    }
    setPaywallContext('share');
    setPaywallVisible(true);
  };
  const handleDownload = async () => {
    if (isPremium) {
      await runAction(cardRef, 'download_card');
      return;
    }
    setPaywallContext('save');
    setPaywallVisible(true);
  };

  // Free path: while pendingPlainEvent is set, the visible card renders
  // non-personalized (no name/photo). Wait for that render to paint, then
  // capture the on-screen card and run the action, then revert.
  useEffect(() => {
    if (!pendingPlainEvent) return;
    let cancelled = false;
    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (cancelled) return;
      await runAction(cardRef, pendingPlainEvent);
      if (!cancelled) setPendingPlainEvent(null);
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlainEvent]);

  const handleShareWithoutPersonalization = () => {
    setPaywallVisible(false);
    setPendingPlainEvent(eventForContext(paywallContext));
  };

  const handleSubscribed = (planId: string) => {
    setPaywallVisible(false);
    void (async () => {
      await refreshProfile();
      void track(uid, 'purchase_completed', { plan_id: planId, card_id: card.id });
      // Let the watermark removal (isPremium → true) paint before capture.
      await new Promise((resolve) => setTimeout(resolve, 250));
      await runAction(cardRef, eventForContext(paywallContext));
    })();
  };

  const handleChangePhoto = () => {
    void track(uid, 'change_photo', { card_id: card.id });
    openPhotoModal();
  };

  const handleEditName = () => {
    openNameModal();
  };

  return (
    <View style={[styles.cardItem, { width: itemWidth, height: itemHeight }]}>
      <View style={styles.cardArea}>
        <QuoteCard
          card={card}
          user={pendingPlainEvent !== null ? { primaryPhotoUrl: null, name: '' } : user}
          cardRef={cardRef}
          showWatermark={!isPremium || pendingPlainEvent !== null}
        />
      </View>

      <ActionButtons
        onShare={handleShare}
        onDownload={handleDownload}
        onChangePhoto={handleChangePhoto}
        onEditName={handleEditName}
        loadingAction={loadingAction}
        showPersonalization={card.supportsPersonalization}
      />

      {/* Paywall */}
      <PaywallModal
        visible={paywallVisible}
        context={paywallContext}
        uid={uid}
        cardId={card.id}
        category={card.category}
        personalizable={card.supportsPersonalization}
        prefillName={name}
        onClose={() => setPaywallVisible(false)}
        onShareWithoutPersonalization={handleShareWithoutPersonalization}
        onSubscribed={handleSubscribed}
      />
    </View>
  );
}

export default function FeedScreen() {
  const CATEGORIES = useCategories();
  const { width } = useWindowDimensions();
  const itemWidth = width - 32;
  const [listAreaHeight, setListAreaHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const cards = useCardsStore((s) => s.cards);
  const currentCategory = useCardsStore((s) => s.currentCategory);
  const setCurrentCategory = useCardsStore((s) => s.setCurrentCategory);
  const { loading, hasMore, fetchMore } = useCards();
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);
  const uid = useUserStore((s) => s.uid);

  useEffect(() => {
    void track(uid, 'home_viewed');
  }, []);

  // Double back press to exit — only while Discover (home) is focused.
  // Other tabs/screens fall through to React Navigation (back returns to
  // Discover first); open RN <Modal>s consume back natively before this.
  const lastBackPress = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) return false; // second press → exit
        lastBackPress.current = now;
        ToastAndroid.show(t('feed.backExit'), ToastAndroid.SHORT);
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Card }> }) => {
      viewableItems.forEach(({ item }) => {
        void track(uid, 'view_card', { card_id: item.id, category: item.category });
      });
    },
    [uid]
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredCategories = trimmedQuery
    ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(trimmedQuery))
    : [];

  const handleSelectCategory = (id: string) => {
    setCurrentCategory(id);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('feed.searchPlaceholder')}
            placeholderTextColor="#89726d"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (filteredCategories.length > 0) {
                handleSelectCategory(filteredCategories[0].id);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Create' as never)}
        >
          <Text style={styles.createBtnText}>{t('feed.create')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.avatar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          {primaryPhotoUrl ? (
            <Image source={{ uri: primaryPhotoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>

        {filteredCategories.length > 0 && (
          <View style={styles.searchResults}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectCategory(c.id)}
                >
                  <Text style={styles.searchResultText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Category Chips */}
      <CategoryChips selected={currentCategory} onSelect={setCurrentCategory} />

      {/* Feed */}
      <View
        style={styles.feedArea}
        onLayout={(e) => setListAreaHeight(e.nativeEvent.layout.height)}
      >
        {loading && cards.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#9d3d2c" />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('feed.emptyCategory')}</Text>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CardItem
                card={item}
                itemWidth={itemWidth}
                itemHeight={listAreaHeight}
              />
            )}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            snapToInterval={listAreaHeight || undefined}
            snapToAlignment="start"
            decelerationRate="fast"
            onEndReached={() => { if (hasMore && !loading) fetchMore(); }}
            onEndReachedThreshold={0.4}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListFooterComponent={
              loading && cards.length > 0 ? (
                <ActivityIndicator color="#9d3d2c" style={styles.footerLoader} />
              ) : null
            }
          />
        )}
      </View>
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
    position: 'relative',
    zIndex: 10,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1c1c19',
    padding: 0,
  },
  searchClear: {
    fontSize: 13,
    color: '#89726d',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    maxHeight: 240,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebe8e3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f3ee',
  },
  searchResultText: {
    fontSize: 14,
    color: '#1c1c19',
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
  feedArea: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    backgroundColor: '#fcf9f4',
  },
  cardItem: {
    // width and height set dynamically
    paddingTop: 12,
  },
  cardArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
