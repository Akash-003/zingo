import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoUploader from '../../components/PhotoUploader';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';
import { showAlert } from '../../store/alertStore';
import { track } from '../../services/analytics';
import { t } from '../../i18n';

export default function ProfileSetupScreen() {
  const uid = useUserStore((s) => s.uid);
  const setName = useUserStore((s) => s.setName);
  const setPrimaryPhotoUrl = useUserStore((s) => s.setPrimaryPhotoUrl);
  const setPhotos = useUserStore((s) => s.setPhotos);
  const photos = useUserStore((s) => s.photos);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);

  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const nameRef = useRef<TextInput>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const kbVisible = kbHeight > 0;

  // Gently pulse a halo around the photo circle to nudge the (otherwise easy to
  // miss) photo action. Runs only while no photo is set; native driver is fine
  // here — unlike the WelcomeScreen deck there's no per-frame index reset.
  useEffect(() => {
    if (primaryPhotoUrl) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [primaryPhotoUrl, pulse]);

  // Prefill the name for providers that supply one — Truecaller stores the
  // verified name in user_metadata.full_name (set server-side by the
  // truecaller-auth Edge Function). Only seeds an empty field, so it never
  // clobbers what the user has typed. Google/guest users have no full_name → noop.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const fullName = data.session?.user?.user_metadata?.full_name as string | undefined;
      if (fullName) setNameInput((cur) => cur || fullName);
    });
  }, []);

  // Open the keyboard with the name field focused on arrival. The short delay
  // lets the auth→ProfileSetup navigation transition settle — the bare
  // autoFocus prop is unreliable right after a transition.
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  // Track the keyboard height. Under edgeToEdgeEnabled the Android window does
  // not resize for the keyboard (and neither adjustResize nor
  // KeyboardAvoidingView lifts content), so we pad the layout by the keyboard
  // height ourselves to keep the actions above it.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handlePhotoUploaded = (url: string) => {
    setPrimaryPhotoUrl(url);
    setPhotos([...photos, url]);
  };

  const saveProfile = async (nameToSave: string, skipName = false) => {
    try {
      setSaving(true);
      const updates: Record<string, string | null> = {};
      if (!skipName && nameToSave.trim()) updates.name = nameToSave.trim();
      if (primaryPhotoUrl) updates.primary_photo_url = primaryPhotoUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', uid);

      if (error) throw error;

      void track(uid, 'profile_completed', { skipped: skipName });
      if (!skipName && nameToSave.trim()) setName(nameToSave.trim());
      // If skipping, set a placeholder so RootNavigator navigates to MainStack
      if (skipName) setName(t('setup.guestName'));
    } catch {
      showAlert(t('common.error'), t('setup.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (text: string) => {
    setNameInput(text);
    if (nameError && text.trim()) setNameError(false);
  };

  const handleStartExploring = () => {
    if (!nameInput.trim()) {
      setNameError(true);
      return;
    }
    saveProfile(nameInput);
  };

  const handleSkip = () => {
    saveProfile('', true);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View
        style={[
          styles.content,
          kbVisible && { paddingBottom: Math.max(kbHeight - insets.bottom, 24) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headline}>{t('setup.headline')}</Text>
          <Text style={styles.subtitle}>{t('setup.subtitle')}</Text>
        </View>

        {/* Inputs — the primary, useful elements, placed high */}
        <View style={[styles.form, kbVisible && { gap: 10 }]}>
          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <View style={styles.photoWrap}>
              {!primaryPhotoUrl && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.photoGlow,
                    {
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
                    },
                  ]}
                />
              )}
              <PhotoUploader
                onPhotoUploaded={handlePhotoUploaded}
                currentPhotoUrl={primaryPhotoUrl}
                placeholder="avatar"
              />
              {!primaryPhotoUrl && (
                <View pointerEvents="none" style={styles.photoBadge}>
                  <Ionicons name="add" size={18} color="#ffffff" />
                </View>
              )}
            </View>
            <Text style={styles.photoLabel}>{t('setup.addPhoto')}</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{t('setup.nameLabel')}</Text>
            <TextInput
              ref={nameRef}
              style={[styles.input, nameError && styles.inputError]}
              placeholder={t('setup.namePlaceholder')}
              placeholderTextColor="rgba(86,66,62,0.4)"
              value={nameInput}
              onChangeText={handleNameChange}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleStartExploring}
            />
            {nameError && (
              <Text style={styles.errorText}>{t('setup.nameError')}</Text>
            )}
          </View>
        </View>

        {/* Card Preview — secondary, fills remaining space. Hidden while the
            keyboard is up so it doesn't clip/overlap the rising actions. */}
        <View style={styles.previewWrapper}>
          {!kbVisible && (
            <View style={styles.previewCard}>
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>{t('setup.previewChip')}</Text>
                </View>
                <View style={styles.previewAccent} />
                <Text style={styles.previewQuote}>{t('setup.previewQuote')}</Text>
                <View style={styles.previewAuthorRow}>
                  <View style={styles.previewAvatar}>
                    {primaryPhotoUrl ? (
                      <Image source={{ uri: primaryPhotoUrl }} style={styles.previewAvatarImage} />
                    ) : (
                      <View style={styles.previewAvatarPlaceholder} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.previewName}>
                      {nameInput.trim() || t('setup.yourName')}
                    </Text>
                    <Text style={styles.previewRole}>{t('setup.previewRole')}</Text>
                  </View>
                </View>
            </View>
          )}
        </View>

        {/* Action Buttons — pinned to the bottom */}
        <View style={styles.actions}>
          <LinearGradient
            colors={['#9d3d2c', '#bd5541']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientWrapper, !nameInput.trim() && styles.gradientDisabled]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartExploring}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>{t('setup.startExploring')}</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            disabled={saving}
          >
            <Text style={styles.skipButtonText}>{t('setup.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fcf9f4',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  headline: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1c1c19',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#56423e',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  previewWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#1c1c19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.1)',
  },
  previewChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(157,61,44,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: 2,
  },
  previewAccent: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(157,61,44,0.2)',
    borderRadius: 2,
  },
  previewQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#1c1c19',
    lineHeight: 23,
  },
  previewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ebe8e3',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fcf9f4',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  previewAvatarPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(235,232,227,0.8)',
  },
  previewName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1c19',
    letterSpacing: 0.3,
  },
  previewRole: {
    fontSize: 11,
    color: '#56423e',
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 28,
    zIndex: 1,
  },
  photoSection: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  photoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9d3d2c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fcf9f4',
  },
  photoGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    // Pure accent halo — no fill, so it reads as a glow, not a second circle.
    // boxShadow is supported on iOS + Android in RN 0.81.
    boxShadow: '0px 0px 22px 6px rgba(157,61,44,0.6)',
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: 3,
  },
  inputWrapper: {
    width: '100%',
    gap: 10,
  },
  inputLabel: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: 3,
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f6f3ee',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.4)',
    fontSize: 16,
    color: '#1c1c19',
  },
  inputError: {
    borderColor: '#c0392b',
  },
  errorText: {
    marginLeft: 4,
    marginTop: 0,
    fontSize: 12,
    color: '#c0392b',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 20,
    paddingTop: 0,
  },
  gradientWrapper: {
    width: '100%',
    borderRadius: 9999,
    shadowColor: '#9d3d2c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  gradientDisabled: {
    opacity: 0.45,
  },
  primaryButton: {
    width: '100%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(86,66,62,0.6)',
  },
});
