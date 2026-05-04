import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  Dimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * (3 / 2); // fixed 2:3 card ratio, matches 400×600 canvas
const CANVAS_WIDTH = 400;

const CATEGORIES = [
  'good-morning', 'motivational', 'love', 'birthday', 'good-night',
  'festivals', 'shayari', 'devotional', 'friendship', 'life',
];

interface SlotPos { x: number; y: number }

export default function CreateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  // initial fallbacks — replaced by resetHandles() after image pick
  const [photoPos, setPhotoPos] = useState<SlotPos>({ x: PREVIEW_WIDTH / 2 - 50, y: 80 });
  const [namePos, setNamePos] = useState<SlotPos>({ x: PREVIEW_WIDTH / 2 - 60, y: 300 });
  const [circleSize, setCircleSize] = useState(100);
  const [category, setCategory] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);


  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // Fix 1: compute default positions from actual PREVIEW_HEIGHT at pick time
  const resetHandles = (ph: number) => {
    setPhotoPos({ x: PREVIEW_WIDTH / 2 - 50, y: ph * 0.2 - 50 });
    setNamePos({ x: PREVIEW_WIDTH / 2 - 60, y: ph * 0.85 });
    setCircleSize(100);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    resetHandles(PREVIEW_HEIGHT);
  };

  // Fix 2: refs holding live values so the persistent PanResponder always reads current state
  const circleSizeRef = useRef(circleSize);
  const photoPosRef = useRef(photoPos);
  const namePosRef = useRef(namePos);

  const photoStartRef = useRef({ x: 0, y: 0 });
  const nameStartRef = useRef({ x: 0, y: 0 });

  // Fix 2: single persistent PanResponder instances — created once, always read from refs
  const photoResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        photoStartRef.current = { ...photoPosRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const size = circleSizeRef.current;
        setPhotoPos({
          x: clamp(photoStartRef.current.x + gs.dx, 0, PREVIEW_WIDTH - size),
          y: clamp(photoStartRef.current.y + gs.dy, 0, PREVIEW_HEIGHT - size),
        });
      },
    })
  ).current;

  const nameResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        nameStartRef.current = { ...namePosRef.current };
      },
      onPanResponderMove: (_, gs) => {
        setNamePos({
          x: clamp(nameStartRef.current.x + gs.dx, 0, PREVIEW_WIDTH - 120),
          y: clamp(nameStartRef.current.y + gs.dy, 0, PREVIEW_HEIGHT - 32),
        });
      },
    })
  ).current;

  const normalise = (previewCoord: number) => previewCoord * (CANVAS_WIDTH / PREVIEW_WIDTH);

  const publish = async () => {
    if (!imageUri || !uid) return;
    setPublishing(true);
    try {
      const filename = `${Date.now()}.jpg`;
      const path = `${uid}/cards/${filename}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(path);

      const photoSlot = {
        style: 'circle',
        top: Math.round(normalise(photoPos.y)),
        left: Math.round(normalise(photoPos.x)),
        width: Math.round(normalise(circleSize)),
        height: Math.round(normalise(circleSize)),
        borderRadius: 9999,
      };
      const nameSlot = {
        top: Math.round(normalise(namePos.y)),
        left: Math.round(normalise(namePos.x)),
        fontSize: 18,
        color: '#ffffff',
      };

      const { error: insertError } = await supabase.from('cards').insert({
        image_url: urlData.publicUrl,
        category,
        is_premium: false,
        photo_slot: photoSlot,
        name_slot: nameSlot,
        created_by: uid,
        is_public: isPublic,
      });
      if (insertError) throw insertError;

      setPublished(true);
    } catch {
      Alert.alert('Publish failed', 'Could not publish your card. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setCategory(null);
    setIsPublic(false);
    setPublished(false);
    resetHandles(PREVIEW_HEIGHT);
  };

  // Fix 2 + Fix 4: live-value sync effects after handlers, before return
  useEffect(() => { circleSizeRef.current = circleSize; }, [circleSize]);
  useEffect(() => { photoPosRef.current = photoPos; }, [photoPos]);
  useEffect(() => { namePosRef.current = namePos; }, [namePos]);

  if (published) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={72} color="#9d3d2c" />
          <Text style={styles.successTitle}>Card Published!</Text>
          <Text style={styles.successSub}>
            {isPublic ? 'Your card is live in the community feed.' : 'Your card is saved privately.'}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={reset}>
            <Text style={styles.ctaBtnText}>Create Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create a Card</Text>

        {/* Phase 1 — Pick Image */}
        <TouchableOpacity
          style={styles.pickZone}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.pickImage}
              />
              <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.pickPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#89726d" />
              <Text style={styles.pickLabel}>Tap to pick a greeting image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Phase 2 — Position Slots */}
        {imageUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Position your photo & name</Text>
            <Text style={styles.sectionHint}>Drag the handles to reposition. Use the slider to resize your photo.</Text>

            <View style={styles.canvas}>
              <View style={styles.canvasImageWrapper} pointerEvents="none">
                <Image
                  source={{ uri: imageUri }}
                  style={styles.canvasImage}
                />
              </View>

              {/* Photo handle */}
              <View
                {...photoResponder.panHandlers}
                style={[
                  styles.photoHandle,
                  {
                    left: photoPos.x,
                    top: photoPos.y,
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                  },
                ]}
              >
                <Ionicons name="person" size={circleSize * 0.45} color="#fff" />
              </View>

              {/* Name handle */}
              <View
                {...nameResponder.panHandlers}
                style={[styles.nameHandle, { left: namePos.x, top: namePos.y }]}
              >
                <Text style={styles.nameHandleText}>{name || 'Your Name'}</Text>
              </View>
            </View>

            <Text style={styles.sliderLabel}>Photo size: {Math.round(circleSize)}px</Text>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={160}
              value={circleSize}
              onValueChange={setCircleSize}
              minimumTrackTintColor="#9d3d2c"
              maximumTrackTintColor="#e8e0d8"
              thumbTintColor="#9d3d2c"
            />

            <TouchableOpacity style={styles.resetBtn} onPress={() => resetHandles(PREVIEW_HEIGHT)}>
              <Text style={styles.resetBtnText}>Reset positions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 3 — Publish Settings */}
        {imageUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publish Settings</Text>

            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(category === cat ? null : cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat.replace(/-/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Visibility</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[styles.visBtn, !isPublic && styles.visBtnActive]}
                onPress={() => setIsPublic(false)}
              >
                <Text style={[styles.visBtnText, !isPublic && styles.visBtnTextActive]}>My Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visBtn, isPublic && styles.visBtnActive]}
                onPress={() => setIsPublic(true)}
              >
                <Text style={[styles.visBtnText, isPublic && styles.visBtnTextActive]}>Community</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, publishing && styles.ctaBtnDisabled]}
              onPress={publish}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaBtnText}>Publish Card</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1c1c19', marginBottom: 20 },

  // Phase 1
  pickZone: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#89726d',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  pickImage: { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT },
  pickPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  pickLabel: { fontSize: 14, color: '#89726d' },
  changeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Phase 2
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c19', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#89726d', marginBottom: 16 },
  // Fix 3: removed `position: 'relative'` — no-op in React Native
  canvas: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvasImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PREVIEW_WIDTH,
  },
  canvasImage: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  },
  photoHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(157,61,44,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nameHandleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sliderLabel: { fontSize: 13, color: '#56423e', marginTop: 16, marginBottom: 4 },
  slider: { width: PREVIEW_WIDTH, height: 40 },
  resetBtn: { alignSelf: 'flex-start', marginTop: 4 },
  resetBtnText: { fontSize: 13, color: '#9d3d2c' },

  // Phase 3
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1c1c19', marginBottom: 8 },
  chips: { flexDirection: 'row', marginBottom: 20 },
  chip: {
    borderWidth: 1,
    borderColor: '#89726d',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  chipText: { fontSize: 13, color: '#89726d', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  visibilityRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  visBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  visBtnActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  visBtnText: { fontSize: 15, color: '#89726d', fontWeight: '600' },
  visBtnTextActive: { color: '#fff' },
  ctaBtn: {
    backgroundColor: '#9d3d2c',
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#1c1c19' },
  successSub: { fontSize: 15, color: '#89726d', textAlign: 'center' },
});
