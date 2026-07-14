import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n';

interface ActionButtonsProps {
  onShare: () => Promise<void>;
  onDownload: () => Promise<void>;
  onChangePhoto: () => void;
  onEditName: () => void;
  loadingAction?: 'share' | 'download' | null;
  showPersonalization?: boolean;
}

export default function ActionButtons({
  onShare,
  onDownload,
  onChangePhoto,
  onEditName,
  loadingAction = null,
  showPersonalization = true,
}: ActionButtonsProps) {
  const busy = loadingAction !== null;
  return (
    <View style={styles.container}>
      {/* Primary CTAs */}
      <TouchableOpacity
        style={[styles.primaryBtn, styles.shareBtn]}
        onPress={onShare}
        activeOpacity={0.8}
        disabled={busy}
      >
        {loadingAction === 'share' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="share-social-outline" size={18} color="#fff" />
        )}
        <Text style={styles.primaryLabel}>{t('actions.share')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, styles.saveBtn]}
        onPress={onDownload}
        activeOpacity={0.8}
        disabled={busy}
      >
        {loadingAction === 'download' ? (
          <ActivityIndicator size="small" color="#9d3d2c" />
        ) : (
          <Ionicons name="download-outline" size={18} color="#9d3d2c" />
        )}
        <Text style={styles.saveLabel}>{t('actions.save')}</Text>
      </TouchableOpacity>

      {/* Secondary actions — only for personalizable cards */}
      {showPersonalization && (
        <>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onChangePhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={16} color="#56423e" />
            <Text style={styles.secondaryLabel}>{t('actions.photo')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onEditName}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={16} color="#56423e" />
            <Text style={styles.secondaryLabel}>{t('actions.name')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 4,
    gap: 8,
  },

  // Primary buttons (Share + Save) — wider
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  shareBtn: {
    backgroundColor: '#9d3d2c',
  },
  saveBtn: {
    backgroundColor: '#f5ebe8',
    borderWidth: 1,
    borderColor: '#9d3d2c',
  },
  primaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  saveLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9d3d2c',
  },

  // Secondary buttons (Photo + Name) — compact
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f6f3ee',
  },
  secondaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#56423e',
  },
});
