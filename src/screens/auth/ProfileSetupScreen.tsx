import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoUploader from '../../components/PhotoUploader';
import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';

export default function ProfileSetupScreen() {
  const uid = useUserStore((s) => s.uid);
  const setName = useUserStore((s) => s.setName);
  const setPrimaryPhotoUrl = useUserStore((s) => s.setPrimaryPhotoUrl);
  const setPhotos = useUserStore((s) => s.setPhotos);
  const photos = useUserStore((s) => s.photos);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);

  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

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

      if (!skipName && nameToSave.trim()) setName(nameToSave.trim());
      // If skipping, set a placeholder so RootNavigator navigates to MainStack
      if (skipName) setName('Guest');
    } catch {
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartExploring = () => {
    if (!nameInput.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    saveProfile(nameInput);
  };

  const handleSkip = () => {
    saveProfile('', true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background decorations */}
        <View style={styles.decorTopRight} />
        <View style={styles.decorBottomLeft} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headline}>Make it yours</Text>
          <Text style={styles.subtitle}>
            Your name and photo will appear on every card you share
          </Text>
        </View>

        {/* Card Preview */}
        <View style={styles.previewWrapper}>
          <View style={styles.previewDecorBlur} />
          <View style={styles.previewCard}>
            <View style={styles.previewAccent} />
            <Text style={styles.previewQuote}>
              "The beauty of belonging is that it transforms a space into a sanctuary."
            </Text>
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
                  {nameInput.trim() || 'Your Name'}
                </Text>
                <Text style={styles.previewRole}>Kindred Spirit</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <PhotoUploader
              onPhotoUploaded={handlePhotoUploaded}
              currentPhotoUrl={primaryPhotoUrl}
            />
            <Text style={styles.photoLabel}>ADD YOUR PHOTO</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="What should we call you?"
              placeholderTextColor="rgba(86,66,62,0.4)"
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <LinearGradient
              colors={['#9d3d2c', '#bd5541']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientWrapper}
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
                  <Text style={styles.primaryButtonText}>Start Exploring →</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fcf9f4',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 48,
  },
  decorTopRight: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(255,180,165,0.3)',
    borderRadius: 9999,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(222,230,200,0.3)',
    borderRadius: 9999,
  },
  header: {
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  headline: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1c1c19',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#56423e',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  previewWrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    zIndex: 1,
  },
  previewDecorBlur: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(219,227,197,0.2)',
    borderRadius: 16,
    transform: [{ translateX: 16 }],
  },
  previewCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    gap: 24,
    shadowColor: '#1c1c19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(221,192,187,0.1)',
    transform: [{ rotate: '1deg' }],
  },
  previewAccent: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(157,61,44,0.2)',
    borderRadius: 2,
  },
  previewQuote: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#1c1c19',
    lineHeight: 26,
  },
  previewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c19',
    letterSpacing: 0.5,
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
    gap: 40,
    zIndex: 1,
  },
  photoSection: {
    alignItems: 'center',
    gap: 12,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9d3d2c',
    letterSpacing: 3,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#fcf9f4',
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#89726d',
    letterSpacing: 2,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 64,
    paddingHorizontal: 24,
    backgroundColor: '#f6f3ee',
    borderRadius: 16,
    fontSize: 18,
    color: '#1c1c19',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
    paddingTop: 16,
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
  primaryButton: {
    width: '100%',
    height: 64,
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
