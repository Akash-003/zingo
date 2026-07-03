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

interface NameSlot {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  fontSize: number;
  color: string;
  fontWeight?: string;
}

interface SlotCard {
  id: string;
  imageUrl: string;
  nameSlot: NameSlot;
}

const CANVAS_WIDTH = 400;
const STEP = 3;
const SAMPLE_NAME = 'Akash Kumar';

export default function NameSlotAdjustScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const [cards, setCards] = useState<SlotCard[]>([]);
  const [index, setIndex] = useState(0);
  const [slot, setSlot] = useState<NameSlot | null>(null);
  const [imageAspect, setImageAspect] = useState(3 / 4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cardWidth = width - 48;
  const cardHeight = cardWidth / imageAspect;
  const scale = cardWidth / CANVAS_WIDTH;

  useEffect(() => {
    supabase
      .from('cards')
      .select('id, image_url, name_slot')
      .is('created_by', null)
      .not('name_slot', 'is', null)
      .then(({ data }) => {
        setCards(
          (data ?? []).map((row) => ({
            id: row.id as string,
            imageUrl: row.image_url as string,
            nameSlot: row.name_slot as NameSlot,
          }))
        );
        setLoading(false);
      });
  }, []);

  // Load slot + image aspect ratio when card changes
  useEffect(() => {
    const card = cards[index];
    if (!card) return;
    setSlot({ ...card.nameSlot });
    Image.getSize(card.imageUrl, (w, h) => {
      if (h > 0) setImageAspect(w / h);
    });
  }, [index, cards]);

  const TEXT_COLORS = ['#ffffff', '#1c1c19', '#000000', '#9d3d2c', '#ffcc00'];

  const cycleColor = () => {
    setSlot((prev) => {
      if (!prev) return prev;
      const idx = TEXT_COLORS.indexOf(prev.color);
      return { ...prev, color: TEXT_COLORS[(idx + 1) % TEXT_COLORS.length] };
    });
  };

  const nudge = (field: keyof NameSlot, delta: number) => {
    setSlot((prev) => {
      if (!prev || prev[field] === undefined) return prev;
      return { ...prev, [field]: (prev[field] as number) + delta };
    });
  };

  // Up/Down: adjust vertical position
  // If top defined → increase top = moves down; decrease = moves up
  // If bottom defined → increase bottom = moves up; decrease = moves down
  const moveUp = () => {
    if (slot?.top !== undefined) nudge('top', -STEP);
    else if (slot?.bottom !== undefined) nudge('bottom', STEP);
  };
  const moveDown = () => {
    if (slot?.top !== undefined) nudge('top', STEP);
    else if (slot?.bottom !== undefined) nudge('bottom', -STEP);
  };
  const moveLeft = () => {
    if (slot?.left !== undefined) nudge('left', -STEP);
    if (slot?.right !== undefined) nudge('right', STEP);
  };
  const moveRight = () => {
    if (slot?.left !== undefined) nudge('left', STEP);
    if (slot?.right !== undefined) nudge('right', -STEP);
  };

  const save = async () => {
    const card = cards[index];
    if (!card || !slot) return;
    setSaving(true);
    await supabase.rpc('admin_update_name_slot', { card_id: card.id, slot_value: slot });
    setSaving(false);
    setIndex((i) => i + 1);
  };

  const skip = () => setIndex((i) => i + 1);

  const card = cards[index];
  const done = !loading && index >= cards.length;

  // Compute text position from slot (scaled to display size)
  const textStyle = slot
    ? {
        top: slot.top !== undefined ? slot.top * scale : undefined,
        bottom: slot.bottom !== undefined ? slot.bottom * scale : undefined,
        left: slot.left !== undefined ? slot.left * scale : undefined,
        right: slot.right !== undefined ? slot.right * scale : undefined,
        fontSize: slot.fontSize * scale,
        color: slot.color,
        fontWeight: (slot.fontWeight ?? '600') as '600',
      }
    : {};

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#1c1c19" />
        </TouchableOpacity>
        <Text style={styles.title}>Name Slot Editor</Text>
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
          <Text style={styles.doneText}>All slots adjusted!</Text>
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
              <Text style={[styles.nameOverlay, textStyle]} numberOfLines={1}>
                {SAMPLE_NAME}
              </Text>
            )}
          </View>

          {/* Current raw values */}
          {slot && (
            <View style={styles.valuesRow}>
              {slot.top !== undefined && <Text style={styles.val}>top: {Math.round(slot.top)}</Text>}
              {slot.bottom !== undefined && <Text style={styles.val}>bottom: {Math.round(slot.bottom)}</Text>}
              {slot.left !== undefined && <Text style={styles.val}>left: {Math.round(slot.left)}</Text>}
              {slot.right !== undefined && <Text style={styles.val}>right: {Math.round(slot.right)}</Text>}
              <Text style={styles.val}>size: {Math.round(slot.fontSize)}</Text>
            </View>
          )}

          {/* Arrow controls */}
          <View style={styles.controls}>
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

            {/* Font size + color */}
            <View style={styles.fontControls}>
              <Text style={styles.fontLabel}>SIZE</Text>
              <View style={styles.fontBtns}>
                <TouchableOpacity
                  style={styles.fontBtn}
                  onPress={() => setSlot((p) => p ? { ...p, fontSize: Math.max(8, p.fontSize - 1) } : p)}
                >
                  <Text style={styles.fontBtnText}>A−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fontBtn}
                  onPress={() => setSlot((p) => p ? { ...p, fontSize: p.fontSize + 1 } : p)}
                >
                  <Text style={styles.fontBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fontLabel}>COLOR</Text>
              <TouchableOpacity
                style={[styles.fontBtn, styles.colorBtn, slot ? { backgroundColor: slot.color, borderColor: '#89726d' } : null]}
                onPress={cycleColor}
              >
                <Text style={[styles.fontBtnText, { color: slot?.color === '#ffffff' ? '#1c1c19' : '#ffffff' }]}>Aa</Text>
              </TouchableOpacity>
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
  nameOverlay: { position: 'absolute', textAlign: 'center', fontWeight: '600' },
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
  fontControls: { alignItems: 'center', gap: 8 },
  fontLabel: { fontSize: 11, fontWeight: '700', color: '#9d3d2c', letterSpacing: 2 },
  fontBtns: { gap: 8 },
  fontBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  fontBtnText: { fontSize: 15, fontWeight: '700', color: '#1c1c19' },
  colorBtn: { borderWidth: 2 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  skipBtn: {
    flex: 1, borderRadius: 99, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#89726d',
  },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: '#89726d' },
  saveBtn: { flex: 2, backgroundColor: '#9d3d2c', borderRadius: 99, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
