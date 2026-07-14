import { useState } from 'react';
import {
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
import { removeBackground } from '../services/backgroundRemoval';
import { useUserStore } from '../store/userStore';
import { showAlert } from '../store/alertStore';
import { t } from '../i18n';

interface PhotoUploaderProps {
  onPhotoUploaded: (url: string) => void;
  currentPhotoUrl?: string | null;
  placeholder?: 'plus' | 'avatar';
  size?: number;
}

export default function PhotoUploader({
  onPhotoUploaded,
  currentPhotoUrl,
  placeholder = 'plus',
  size = 96,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const uid = useUserStore((s) => s.uid);

  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('common.permissionRequired'), t('uploader.permissionBody'));
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
      // expo-file-system is native-only; skip background removal on web
      const processedUri = Platform.OS === 'web' ? localUri : await removeBackground(localUri);
      const publicUrl = await uploadToStorage(processedUri);
      onPhotoUploaded(publicUrl);
    } catch (err) {
      showAlert(t('uploader.failedTitle'), t('uploader.failedBody'));
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

  const r = size / 2;
  return (
    <TouchableOpacity
      style={[styles.container, isAvatar && styles.containerAvatar, { width: size, height: size, borderRadius: r }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {uploading ? (
        <ActivityIndicator size="small" color="#9d3d2c" />
      ) : currentPhotoUrl ? (
        <Image source={{ uri: currentPhotoUrl }} style={[styles.photo, { width: size, height: size, borderRadius: r }]} />
      ) : (
        <View style={styles.placeholder}>
          {isAvatar ? (
            <Ionicons name="person" size={size * 0.48} color="#b0a098" />
          ) : (
            <Text style={[styles.icon, { fontSize: size * 0.33 }]}>＋</Text>
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
