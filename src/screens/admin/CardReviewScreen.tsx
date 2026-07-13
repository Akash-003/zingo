import { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import { showAlert } from '../../store/alertStore';

interface NameSlot {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  fontSize: number;
  color: string;
  fontWeight?: string;
}

interface SeedCard {
  id: string;
  imageUrl: string;
  nameSlot: NameSlot | null;
}

const CANVAS_WIDTH = 400;

export default function CardReviewScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const [cards, setCards] = useState<SeedCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cardWidth = width - 48;
  const cardHeight = cardWidth * 1.4;
  const scale = cardWidth / CANVAS_WIDTH;

  useEffect(() => {
    supabase
      .from('cards')
      .select('id, image_url, name_slot')
      .is('created_by', null)
      .eq('name_slot_reviewed', false)
      .order('category', { ascending: true })
      .then(({ data }) => {
        setCards(
          (data ?? []).map((row) => ({
            id: row.id as string,
            imageUrl: row.image_url as string,
            nameSlot: (row.name_slot as NameSlot) ?? null,
          }))
        );
        setLoading(false);
      });
  }, []);

  const advance = () => setIndex((i) => i + 1);

  const markLooksGood = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('admin_review_card', { card_id: cards[index].id, has_name_area: true });
    setSaving(false);
    if (error) {
      showAlert('Could not save', error.message);
      return;
    }
    advance();
  };

  const markNoArea = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('admin_review_card', { card_id: cards[index].id, has_name_area: false });
    setSaving(false);
    if (error) {
      showAlert('Could not save', error.message);
      return;
    }
    advance();
  };

  const card = cards[index];
  const done = !loading && index >= cards.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#1c1c19" />
        </TouchableOpacity>
        <Text style={styles.title}>Card Review</Text>
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
          <Text style={styles.doneText}>All cards reviewed!</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(index / cards.length) * 100}%` }]} />
          </View>

          <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
            <Image
              source={{ uri: card.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            {card.nameSlot && (
              <Text
                style={[
                  styles.nameOverlay,
                  {
                    top: card.nameSlot.top !== undefined ? card.nameSlot.top * scale : undefined,
                    bottom: card.nameSlot.bottom !== undefined ? card.nameSlot.bottom * scale : undefined,
                    left: card.nameSlot.left !== undefined ? card.nameSlot.left * scale : undefined,
                    right: card.nameSlot.right !== undefined ? card.nameSlot.right * scale : undefined,
                    fontSize: card.nameSlot.fontSize * scale,
                    color: card.nameSlot.color,
                  },
                ]}
                numberOfLines={1}
              >
                Your Name
              </Text>
            )}
          </View>

          <Text style={styles.hint}>
            Does this card have a dedicated design space where "Your Name" fits naturally?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.noBtn} onPress={markNoArea} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close" size={20} color="#fff" />
                  <Text style={styles.btnText}>No Name Area</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.yesBtn} onPress={markLooksGood} disabled={saving}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.btnText}>Looks Good</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  doneBtn: {
    backgroundColor: '#9d3d2c',
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, gap: 20 },
  progressBar: { width: '100%', height: 4, backgroundColor: '#f0ede9', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#9d3d2c', borderRadius: 2 },
  cardContainer: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#f0ede9' },
  nameOverlay: { position: 'absolute', textAlign: 'center', fontWeight: '600' },
  hint: { fontSize: 13, color: '#89726d', textAlign: 'center', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  noBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ba1a1a',
    borderRadius: 99,
    paddingVertical: 16,
  },
  yesBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#388e3c',
    borderRadius: 99,
    paddingVertical: 16,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
