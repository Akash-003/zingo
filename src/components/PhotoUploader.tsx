import { useState } from 'react';
import {
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
import { removeBackground } from '../services/backgroundRemoval';
import { useUserStore } from '../store/userStore';
import { showAlert } from '../store/alertStore';

interface PhotoUploaderProps {
  onPhotoUploaded: (url: string) => void;
  currentPhotoUrl?: string | null;
  // 'plus' (default): dashed circle with a ＋ — the standard add-photo affordance.
  // 'avatar': solid light circle with a person silhouette — used on ProfileSetup,
  // which pairs it with its own external ＋ badge.
  placeholder?: 'plus' | 'avatar';
}

export default function PhotoUploader({
  onPhotoUploaded,
  currentPhotoUrl,
  placeholder = 'plus',
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const uid = useUserStore((s) => s.uid);

  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Please allow photo access to upload your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      setUploading(true);
      const localUri = result.assets[0].uri;
      const processedUri = await removeBackground(localUri);
      const publicUrl = await uploadToStorage(processedUri);
      onPhotoUploaded(publicUrl);
    } catch (err) {
      showAlert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const uploadToStorage = async (uri: string): Promise<string> => {
    const filename = `${Date.now()}.png`;
    const path = `${uid}/${filename}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from('user-photos')
      .upload(path, arrayBuffer, { contentType: 'image/png', upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('user-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const isAvatar = placeholder === 'avatar';

  return (
    <TouchableOpacity
      style={[styles.container, isAvatar && styles.containerAvatar]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {uploading ? (
        <ActivityIndicator size="large" color="#9d3d2c" />
      ) : currentPhotoUrl ? (
        <Image source={{ uri: currentPhotoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.placeholder}>
          {isAvatar ? (
            <Ionicons name="person" size={46} color="#b0a098" />
          ) : (
            <Text style={styles.icon}>＋</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#89726d',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f6f3ee',
  },
  containerAvatar: {
    borderStyle: 'solid',
    borderColor: '#cdbfb9',
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    color: '#89726d',
  },
});
