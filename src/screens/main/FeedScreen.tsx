import { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuoteCard from '../../components/cards/QuoteCard';
import ActionButtons from '../../components/ActionButtons';
import CategoryChips from '../../components/CategoryChips';
import PhotoUploader from '../../components/PhotoUploader';
import { useCards } from '../../hooks/useCards';
import { useCardCapture } from '../../hooks/useCardCapture';
import { useUserProfile } from '../../hooks/useUserProfile';
import { shareCard, downloadCard } from '../../services/sharing';
import { track } from '../../services/analytics';
import { useCardsStore, Card } from '../../store/cardsStore';
import { useUserStore } from '../../store/userStore';

interface CardItemProps {
  card: Card;
  itemWidth: number;
}

function CardItem({ card, itemWidth }: CardItemProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const cardRef = useRef<View>(null);
  const { capture } = useCardCapture();
  const { updateName, addPhoto, setPrimaryPhoto, loading: profileLoading } = useUserProfile();
  const uid = useUserStore((s) => s.uid);
  const isPremium = useUserStore((s) => s.isPremium);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);
  const user = { primaryPhotoUrl, name };

  const captureAndRun = async (action: (uri: string) => Promise<void>, event: 'share_card' | 'download_card') => {
    try {
      setActionLoading(true);
      const uri = await capture(cardRef);
      await action(uri);
      void track(uid, event, { card_id: card.id, category: card.category });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => captureAndRun(shareCard, 'share_card');
  const handleDownload = () => captureAndRun(downloadCard, 'download_card');

  const handleChangePhoto = () => {
    void track(uid, 'change_photo', { card_id: card.id });
    setPhotoModalVisible(true);
  };

  const handlePhotoUploaded = async (url: string) => {
    setPhotoModalVisible(false);
    await addPhoto(url);
    await setPrimaryPhoto(url);
  };

  const handleEditName = () => {
    setEditNameValue(name);
    setNameModalVisible(true);
  };

  const handleSaveName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    await updateName(trimmed);
    setNameModalVisible(false);
  };

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

      {/* Edit Name modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setNameModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <Text style={styles.modalSubtitle}>
              This name appears on every card you share.
            </Text>
            <TextInput
              style={styles.nameInput}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder="Your name"
              placeholderTextColor="rgba(86,66,62,0.4)"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, profileLoading && styles.modalBtnDisabled]}
                onPress={handleSaveName}
                disabled={profileLoading}
              >
                {profileLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Photo modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setPhotoModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Change Photo</Text>
            <Text style={styles.modalSubtitle}>
              Upload a new photo to appear on all your cards.
            </Text>
            <View style={styles.uploaderWrap}>
              <PhotoUploader
                onPhotoUploaded={handlePhotoUploaded}
                currentPhotoUrl={primaryPhotoUrl}
              />
            </View>
            <TouchableOpacity
              style={styles.modalCancelStandalone}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  const navigation = useNavigation();

  const cards = useCardsStore((s) => s.cards);
  const currentCategory = useCardsStore((s) => s.currentCategory);
  const setCurrentCategory = useCardsStore((s) => s.setCurrentCategory);
  const { loading, hasMore, fetchMore } = useCards();
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const name = useUserStore((s) => s.name);
  const uid = useUserStore((s) => s.uid);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Card }> }) => {
      viewableItems.forEach(({ item }) => {
        void track(uid, 'view_card', { card_id: item.id, category: item.category });
      });
    },
    [uid]
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;


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
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Create' as never)}
        >
          <Text style={styles.createBtnText}>CREATE</Text>
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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

  // Shared modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c19',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#56423e',
    marginBottom: 20,
    lineHeight: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e0d8d0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1c19',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 99,
    backgroundColor: '#9d3d2c',
    alignItems: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#56423e',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  uploaderWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCancelStandalone: {
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
  },
});
