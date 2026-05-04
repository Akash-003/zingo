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
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * (3 / 2); // fixed 2:3, matches 400×600 canvas
const CANVAS_WIDTH = 400;

const CATEGORIES = [
  'good-morning', 'motivational', 'love', 'birthday', 'good-night',
  'festivals', 'shayari', 'devotional', 'friendship', 'life',
];

const NAME_COLORS = ['#ffffff', '#000000', '#FFD700', '#FF5252', '#69F0AE', '#40C4FF', '#FF80AB', '#E0E0E0'];

const STEPS = [
  { icon: 'image-outline' as const, label: 'Pick a greeting card image' },
  { icon: 'move-outline' as const, label: 'Position your photo & name on the card' },
  { icon: 'send-outline' as const, label: 'Set visibility and publish' },
];

interface SlotPos { x: number; y: number }

export default function CreateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState<SlotPos>({ x: PREVIEW_WIDTH / 2 - 50, y: 80 });
  const [namePos, setNamePos] = useState<SlotPos>({ x: PREVIEW_WIDTH / 2 - 60, y: 300 });
  const [circleSize, setCircleSize] = useState(100);
  const [nameColor, setNameColor] = useState('#ffffff');
  const [nameFontSize, setNameFontSize] = useState(18);
  const [nameBold, setNameBold] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const resetHandles = () => {
    setPhotoPos({ x: PREVIEW_WIDTH / 2 - 50, y: PREVIEW_HEIGHT * 0.2 - 50 });
    setNamePos({ x: PREVIEW_WIDTH / 2 - 60, y: PREVIEW_HEIGHT * 0.85 });
    setCircleSize(100);
    setNameColor('#ffffff');
    setNameFontSize(18);
    setNameBold(false);
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
    setImageUri(result.assets[0].uri);
    resetHandles();
  };

  // Live-value refs so the persistent PanResponder always reads current state
  const circleSizeRef = useRef(circleSize);
  const photoPosRef = useRef(photoPos);
  const namePosRef = useRef(namePos);
  const photoStartRef = useRef({ x: 0, y: 0 });
  const nameStartRef = useRef({ x: 0, y: 0 });

  // Single persistent PanResponder instances — created once, read from refs
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

      const base64 = await new File(imageUri).base64();
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(path, byteArray, { contentType: 'image/jpeg', upsert: false });
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
        fontSize: nameFontSize,
        color: nameColor,
        fontWeight: nameBold ? 'bold' : 'normal',
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

      // Reset to default state and show a brief confirmation
      const msg = isPublic ? 'Your card is live in the community feed.' : 'Your card has been saved privately.';
      setImageUri(null);
      setCategory(null);
      setIsPublic(false);
      resetHandles();
      Alert.alert('Card Published!', msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      Alert.alert('Publish failed', msg);
    } finally {
      setPublishing(false);
    }
  };

  // Sync live-value refs after handlers
  useEffect(() => { circleSizeRef.current = circleSize; }, [circleSize]);
  useEffect(() => { photoPosRef.current = photoPos; }, [photoPos]);
  useEffect(() => { namePosRef.current = namePos; }, [namePos]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create a Card</Text>

        {/* Canvas — shows placeholder when no image, drag canvas when image picked */}
        {imageUri ? (
          <View style={styles.canvas}>
            <Image source={{ uri: imageUri }} style={styles.canvasImage} />

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
              <Text style={{ color: nameColor, fontSize: nameFontSize, fontWeight: nameBold ? 'bold' : 'normal' }}>
                {name || 'Your Name'}
              </Text>
            </View>

            {/* Change image overlay */}
            <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={14} color="#fff" />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.pickZone} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={52} color="#9d3d2c" />
            <Text style={styles.pickTitle}>Upload Card Image</Text>
            <Text style={styles.pickLabel}>Tap to choose from your gallery</Text>
          </TouchableOpacity>
        )}

        {/* Step hints — shown only on empty state */}
        {!imageUri && (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsHeading}>How it works</Text>
            {STEPS.map((step, i) => (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon} size={18} color="#9d3d2c" style={styles.stepIcon} />
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Controls — shown only when image is picked */}
        {imageUri && (
          <>
            {/* Photo size */}
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>Photo size: {Math.round(circleSize)}px</Text>
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
              <TouchableOpacity style={styles.resetBtn} onPress={resetHandles}>
                <Text style={styles.resetBtnText}>Reset positions</Text>
              </TouchableOpacity>
            </View>

            {/* Name style */}
            <View style={styles.controlSection}>
              <Text style={styles.sectionTitle}>Name Style</Text>

              <Text style={styles.controlLabel}>Color</Text>
              <View style={styles.colorRow}>
                {NAME_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, nameColor === c && styles.colorSwatchActive]}
                    onPress={() => setNameColor(c)}
                  />
                ))}
              </View>

              <Text style={styles.controlLabel}>Font size: {Math.round(nameFontSize)}px</Text>
              <Slider
                style={styles.slider}
                minimumValue={12}
                maximumValue={36}
                value={nameFontSize}
                onValueChange={setNameFontSize}
                minimumTrackTintColor="#9d3d2c"
                maximumTrackTintColor="#e8e0d8"
                thumbTintColor="#9d3d2c"
              />

              <View style={styles.weightRow}>
                <TouchableOpacity
                  style={[styles.weightBtn, !nameBold && styles.weightBtnActive]}
                  onPress={() => setNameBold(false)}
                >
                  <Text style={[styles.weightBtnText, !nameBold && styles.weightBtnTextActive]}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.weightBtn, nameBold && styles.weightBtnActive]}
                  onPress={() => setNameBold(true)}
                >
                  <Text style={[styles.weightBtnText, nameBold && styles.weightBtnTextActive, styles.boldText]}>Bold</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Publish settings */}
            <View style={styles.controlSection}>
              <Text style={styles.sectionTitle}>Publish Settings</Text>

              <Text style={styles.controlLabel}>Category (optional)</Text>
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

              <Text style={styles.controlLabel}>Visibility</Text>
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
          </>
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

  // Card zone
  pickZone: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#9d3d2c',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fdf8f5',
    marginBottom: 20,
  },
  pickTitle: { fontSize: 16, fontWeight: '700', color: '#9d3d2c' },
  pickLabel: { fontSize: 13, color: '#89726d' },

  // Step hints
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  stepsHeading: { fontSize: 14, fontWeight: '700', color: '#56423e', letterSpacing: 0.5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#f0ede9',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#9d3d2c' },
  stepIcon: { marginRight: -4 },
  stepLabel: { flex: 1, fontSize: 14, color: '#1c1c19' },

  // Canvas
  canvas: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  canvasImage: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  changeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Controls
  controlSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c19', marginBottom: 12 },
  controlLabel: { fontSize: 13, color: '#56423e', marginBottom: 4 },
  slider: { width: PREVIEW_WIDTH - 32, height: 40, marginBottom: 8 },
  resetBtn: { alignSelf: 'flex-start' },
  resetBtnText: { fontSize: 13, color: '#9d3d2c' },

  // Color swatches
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#e0d8d0' },
  colorSwatchActive: { borderWidth: 3, borderColor: '#9d3d2c' },

  // Bold toggle
  weightRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  weightBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  weightBtnActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  weightBtnText: { fontSize: 14, color: '#89726d' },
  weightBtnTextActive: { color: '#fff' },
  boldText: { fontWeight: 'bold' },

  // Category chips
  chips: { marginBottom: 16 },
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

  // Visibility
  visibilityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  visBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 99,
    borderWidth: 1, borderColor: '#89726d',
    alignItems: 'center', backgroundColor: '#fff',
  },
  visBtnActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  visBtnText: { fontSize: 15, color: '#89726d', fontWeight: '600' },
  visBtnTextActive: { color: '#fff' },

  // CTA
  ctaBtn: { backgroundColor: '#9d3d2c', borderRadius: 99, paddingVertical: 16, alignItems: 'center' },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
