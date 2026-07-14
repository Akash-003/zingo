import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';
import { useCardsStore } from '../../store/cardsStore';
import { showAlert } from '../../store/alertStore';
import { t, categoryLabel } from '../../i18n';
import { useCategories } from '../../components/CategoryChips';

interface CollectionCard {
  id: string;
  imageUrl: string;
  category: string | null;
  isPublic: boolean;
  createdAt: string;
}

export default function CollectionsScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  // Same list as the feed chips, minus the 'all' pseudo-category.
  const CATEGORIES = useCategories().filter((c) => c.id !== 'all');
  const uid = useUserStore((s) => s.uid);
  const removeCardFromFeed = useCardsStore((s) => s.removeCard);

  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuCard, setMenuCard] = useState<CollectionCard | null>(null);
  const [editCard, setEditCard] = useState<CollectionCard | null>(null);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const COLUMN_GAP = 12;
  const PADDING_H = 16;
  const itemWidth = (width - PADDING_H * 2 - COLUMN_GAP) / 2;

  const fetchCards = useCallback(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('cards')
      .select('id, image_url, category, is_public, created_at')
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCards(
          (data ?? []).map((row) => ({
            id: row.id as string,
            imageUrl: row.image_url as string,
            category: row.category as string | null,
            isPublic: row.is_public as boolean,
            createdAt: row.created_at as string,
          }))
        );
        setLoading(false);
      });
  }, [uid]);

  useFocusEffect(fetchCards);

  const openMenu = (card: CollectionCard) => setMenuCard(card);
  const closeMenu = () => setMenuCard(null);

  const openEdit = (card: CollectionCard) => {
    setEditCard(card);
    setEditCategory(card.category);
    setEditIsPublic(card.isPublic);
    setMenuCard(null);
  };

  const saveEdit = async () => {
    if (!editCard) return;
    setSaving(true);
    const { error } = await supabase
      .from('cards')
      .update({ category: editCategory, is_public: editIsPublic })
      .eq('id', editCard.id);
    setSaving(false);
    if (error) {
      showAlert(t('common.error'), t('collections.saveError'));
      return;
    }
    setCards((prev) =>
      prev.map((c) =>
        c.id === editCard.id ? { ...c, category: editCategory, isPublic: editIsPublic } : c
      )
    );
    setEditCard(null);
  };

  const confirmDelete = (card: CollectionCard) => {
    closeMenu();
    showAlert(t('collections.deleteCard'), t('collections.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('cards').delete().eq('id', card.id);
          if (error) {
            showAlert(t('common.error'), t('collections.deleteError'));
            return;
          }
          setCards((prev) => prev.filter((c) => c.id !== card.id));
          removeCardFromFeed(card.id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('create.myCards')}</Text>
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
          <Text style={styles.emptyTitle}>{t('collections.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('collections.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Create' as never)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>{t('create.heading')}</Text>
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
                    {categoryLabel(item.category)}
                  </Text>
                </View>
              )}
              {/* Visibility badge */}
              <View style={styles.visibilityBadge}>
                <Ionicons
                  name={item.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                  size={10}
                  color="#fff"
                />
              </View>
              {/* Menu trigger */}
              <TouchableOpacity style={styles.menuBtn} onPress={() => openMenu(item)}>
                <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Action menu modal */}
      <Modal visible={!!menuCard} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.menuSheet}>
              <Text style={styles.menuTitle}>{t('collections.cardOptions')}</Text>
              <TouchableOpacity style={styles.menuRow} onPress={() => menuCard && openEdit(menuCard)}>
                <Ionicons name="pencil-outline" size={20} color="#1c1c19" />
                <Text style={styles.menuRowText}>{t('collections.editCard')}</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuRow} onPress={() => menuCard && confirmDelete(menuCard)}>
                <Ionicons name="trash-outline" size={20} color="#ba1a1a" />
                <Text style={[styles.menuRowText, styles.deleteText]}>{t('collections.deleteCard')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editCard} transparent animationType="slide" onRequestClose={() => setEditCard(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEditCard(null)}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={styles.editSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.editTitle}>{t('collections.editCard')}</Text>

              {/* Category */}
              <Text style={styles.editLabel}>{t('collections.categoryLabel')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, editCategory === cat.id && styles.catChipActive]}
                    onPress={() => setEditCategory(cat.id)}
                  >
                    <Text style={[styles.catChipText, editCategory === cat.id && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Visibility */}
              <Text style={styles.editLabel}>{t('collections.visibilityLabel')}</Text>
              <View style={styles.visRow}>
                <TouchableOpacity
                  style={[styles.visBtn, !editIsPublic && styles.visBtnActive]}
                  onPress={() => setEditIsPublic(false)}
                >
                  <Ionicons name="lock-closed-outline" size={16} color={!editIsPublic ? '#fff' : '#89726d'} />
                  <Text style={[styles.visBtnText, !editIsPublic && styles.visBtnTextActive]}>{t('collections.private')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.visBtn, editIsPublic && styles.visBtnActive]}
                  onPress={() => setEditIsPublic(true)}
                >
                  <Ionicons name="globe-outline" size={16} color={editIsPublic ? '#fff' : '#89726d'} />
                  <Text style={[styles.visBtnText, editIsPublic && styles.visBtnTextActive]}>{t('create.community')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t('collections.saveChanges')}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fcf9f4' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8e3',
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1c1c19' },
  countBadge: { backgroundColor: '#f0ede9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 13, fontWeight: '600', color: '#9d3d2c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#89726d', textAlign: 'center', lineHeight: 20 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#9d3d2c', borderRadius: 9999,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 16,
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  grid: { padding: 16, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 16 },
  card: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0ede9' },
  cardImage: { borderRadius: 12 },
  chip: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  visibilityBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 99,
    padding: 4,
  },
  menuBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 99,
    padding: 6,
  },
  // Overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  // Action menu
  menuSheet: {
    width: 260, backgroundColor: '#fff', borderRadius: 20,
    padding: 20, marginBottom: 40, gap: 4,
  },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#89726d', marginBottom: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuRowText: { fontSize: 16, color: '#1c1c19' },
  menuDivider: { height: 1, backgroundColor: '#f0ede9' },
  deleteText: { color: '#ba1a1a' },
  // Edit sheet
  editSheet: {
    width: '100%', backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0d8d0', alignSelf: 'center', marginBottom: 8 },
  editTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19' },
  editLabel: { fontSize: 11, fontWeight: '700', color: '#9d3d2c', letterSpacing: 2, marginTop: 4 },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    borderWidth: 1, borderColor: '#89726d', borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    backgroundColor: '#fff',
  },
  catChipActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  catChipText: { fontSize: 13, color: '#89726d' },
  catChipTextActive: { color: '#fff' },
  visRow: { flexDirection: 'row', gap: 10 },
  visBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 99,
    borderWidth: 1, borderColor: '#89726d', backgroundColor: '#fff',
  },
  visBtnActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  visBtnText: { fontSize: 14, fontWeight: '600', color: '#89726d' },
  visBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#9d3d2c', borderRadius: 99,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
