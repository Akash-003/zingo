import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';
import { showAlert } from '../../store/alertStore';

interface PhotoSlot {
  style: string;
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

interface SlotCard {
  id: string;
  imageUrl: string;
  photoSlot: PhotoSlot;
}

const CANVAS_WIDTH = 400;
const STEP_POS = 3;
const STEP_SIZE = 2;

export default function PhotoSlotAdjustScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);

  const [cards, setCards] = useState<SlotCard[]>([]);
  const [index, setIndex] = useState(0);
  const [slot, setSlot] = useState<PhotoSlot | null>(null);
  const [imageAspect, setImageAspect] = useState(3 / 4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cardWidth = width - 48;
  const cardHeight = cardWidth / imageAspect;
  const scale = cardWidth / CANVAS_WIDTH;

  useEffect(() => {
    supabase
      .from('cards')
      .select('id, image_url, photo_slot')
      .is('created_by', null)
      .not('photo_slot', 'is', null)
      .then(({ data }) => {
        setCards(
          (data ?? []).map((row) => ({
            id: row.id as string,
            imageUrl: row.image_url as string,
            photoSlot: row.photo_slot as PhotoSlot,
          }))
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const card = cards[index];
    if (!card) return;
    setSlot({ ...card.photoSlot });
    Image.getSize(card.imageUrl, (w, h) => {
      if (h > 0) setImageAspect(w / h);
    });
  }, [index, cards]);

  const moveUp = () => setSlot((p) => p ? { ...p, top: p.top - STEP_POS } : p);
  const moveDown = () => setSlot((p) => p ? { ...p, top: p.top + STEP_POS } : p);
  const moveLeft = () => setSlot((p) => p ? { ...p, left: p.left - STEP_POS } : p);
  const moveRight = () => setSlot((p) => p ? { ...p, left: p.left + STEP_POS } : p);
  const grow = () => setSlot((p) => p ? { ...p, width: p.width + STEP_SIZE, height: p.height + STEP_SIZE } : p);
  const shrink = () => setSlot((p) => p ? { ...p, width: Math.max(10, p.width - STEP_SIZE), height: Math.max(10, p.height - STEP_SIZE) } : p);

  const save = async () => {
    const card = cards[index];
    if (!card || !slot) return;
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_photo_slot', { card_id: card.id, slot_value: slot });
    setSaving(false);
    if (error) {
      showAlert('Could not save', error.message);
      return;
    }
    setIndex((i) => i + 1);
  };

  const skip = () => setIndex((i) => i + 1);

  const card = cards[index];
  const done = !loading && index >= cards.length;

  const photoRadius = slot ? (Math.min(slot.width, slot.height) * scale) / 2 : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#1c1c19" />
        </TouchableOpacity>
        <Text style={styles.title}>Photo Slot Editor</Text>
        {!loading && !done && (
          <Text style={styles.progress}>{index + 1} / {cards.length}</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9d3d2c" />
        </View>
      ) : done ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color="#4caf50" />
          <Text style={styles.doneText}>All photo slots adjusted!</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card preview */}
          <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
            <Image source={{ uri: card.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {slot && (
              <Image
                source={primaryPhotoUrl ? { uri: primaryPhotoUrl } : require('../../../assets/icon.png')}
                style={{
                  position: 'absolute',
                  top: slot.top * scale,
                  left: slot.left * scale,
                  width: slot.width * scale,
                  height: slot.height * scale,
                  borderRadius: photoRadius,
                }}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Current raw values */}
          {slot && (
            <View style={styles.valuesRow}>
              <Text style={styles.val}>top: {Math.round(slot.top)}</Text>
              <Text style={styles.val}>left: {Math.round(slot.left)}</Text>
              <Text style={styles.val}>w: {Math.round(slot.width)}</Text>
              <Text style={styles.val}>h: {Math.round(slot.height)}</Text>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            {/* Arrow pad */}
            <View style={styles.arrowGrid}>
              <View style={styles.arrowRow}>
                <View style={styles.arrowSpacer} />
                <TouchableOpacity style={styles.arrowBtn} onPress={moveUp}>
                  <Ionicons name="chevron-up" size={22} color="#1c1c19" />
                </TouchableOpacity>
                <View style={styles.arrowSpacer} />
              </View>
              <View style={styles.arrowRow}>
                <TouchableOpacity style={styles.arrowBtn} onPress={moveLeft}>
                  <Ionicons name="chevron-back" size={22} color="#1c1c19" />
                </TouchableOpacity>
                <View style={[styles.arrowBtn, styles.arrowCenter]}>
                  <Ionicons name="move-outline" size={18} color="#89726d" />
                </View>
                <TouchableOpacity style={styles.arrowBtn} onPress={moveRight}>
                  <Ionicons name="chevron-forward" size={22} color="#1c1c19" />
                </TouchableOpacity>
              </View>
              <View style={styles.arrowRow}>
                <View style={styles.arrowSpacer} />
                <TouchableOpacity style={styles.arrowBtn} onPress={moveDown}>
                  <Ionicons name="chevron-down" size={22} color="#1c1c19" />
                </TouchableOpacity>
                <View style={styles.arrowSpacer} />
              </View>
            </View>

            {/* Size */}
            <View style={styles.sizeControls}>
              <Text style={styles.sizeLabel}>SIZE</Text>
              <View style={styles.sizeBtns}>
                <TouchableOpacity style={styles.sizeBtn} onPress={grow}>
                  <Ionicons name="add" size={22} color="#1c1c19" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sizeBtn} onPress={shrink}>
                  <Ionicons name="remove" size={22} color="#1c1c19" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={skip} disabled={saving}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Save & Next</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fcf9f4' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe8e3',
  },
  back: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1c1c19' },
  progress: { fontSize: 14, fontWeight: '600', color: '#9d3d2c' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  doneText: { fontSize: 20, fontWeight: '700', color: '#1c1c19' },
  doneBtn: { backgroundColor: '#9d3d2c', borderRadius: 99, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  content: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, gap: 20 },
  cardContainer: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0ede9' },
  valuesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  val: { fontSize: 12, color: '#89726d', backgroundColor: '#f0ede9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  arrowGrid: { gap: 4 },
  arrowRow: { flexDirection: 'row', gap: 4 },
  arrowBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  arrowCenter: { backgroundColor: '#f6f3ee' },
  arrowSpacer: { width: 52, height: 52 },
  sizeControls: { alignItems: 'center', gap: 8 },
  sizeLabel: { fontSize: 11, fontWeight: '700', color: '#9d3d2c', letterSpacing: 2 },
  sizeBtns: { gap: 8 },
  sizeBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  skipBtn: {
    flex: 1, borderRadius: 99, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#89726d',
  },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: '#89726d' },
  saveBtn: { flex: 2, backgroundColor: '#9d3d2c', borderRadius: 99, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
