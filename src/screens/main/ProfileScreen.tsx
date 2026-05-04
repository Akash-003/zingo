import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUserStore } from '../../store/userStore';
import { useUserProfile } from '../../hooks/useUserProfile';
import PhotoUploader from '../../components/PhotoUploader';

const STATS = [
  { label: 'Collections', value: '0' },
  { label: 'Followers', value: '0' },
  { label: 'Saved', value: '0' },
  { label: 'Featured', value: '0' },
];

const SETTINGS = [
  { icon: 'notifications-outline' as const, label: 'Notifications & Updates' },
  { icon: 'lock-closed-outline' as const, label: 'Privacy & Security' },
  { icon: 'color-palette-outline' as const, label: 'Appearance & Theme' },
];

export default function ProfileScreen() {
  const [editPhotoModal, setEditPhotoModal] = useState(false);

  const name = useUserStore((s) => s.name);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const photos = useUserStore((s) => s.photos);
  const isPremium = useUserStore((s) => s.isPremium);

  const { loading, addPhoto, setPrimaryPhoto, signOut } = useUserProfile();

  const handleAddPhoto = async (url: string) => {
    setEditPhotoModal(false);
    await addPhoto(url);
  };

  const handleSetPrimary = async (url: string) => {
    await setPrimaryPhoto(url);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const emptySlots = Math.max(0, 5 - photos.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.photoWrap}>
            {primaryPhotoUrl ? (
              <Image source={{ uri: primaryPhotoUrl }} style={styles.heroPhoto} />
            ) : (
              <View style={[styles.heroPhoto, styles.heroPlaceholder]}>
                <Ionicons name="person" size={56} color="#89726d" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditPhotoModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{name}</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Identity Vault */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity Vault</Text>
          <Text style={styles.cardSubtitle}>
            Switch between your curated visual identities.
          </Text>

          {loading && (
            <ActivityIndicator size="small" color="#9d3d2c" style={styles.loadingIndicator} />
          )}

          <View style={styles.vaultRow}>
            {photos.map((url) => {
              const isPrimary = url === primaryPhotoUrl;
              return (
                <TouchableOpacity
                  key={url}
                  style={styles.vaultSlot}
                  onPress={() => !isPrimary && handleSetPrimary(url)}
                  activeOpacity={isPrimary ? 1 : 0.7}
                >
                  <View style={[styles.vaultCircle, isPrimary && styles.primaryRing]}>
                    <Image source={{ uri: url }} style={styles.vaultPhoto} />
                  </View>
                  <Text style={styles.vaultLabel}>{isPrimary ? 'Primary' : 'Set Primary'}</Text>
                </TouchableOpacity>
              );
            })}

            {photos.length < 5 &&
              Array.from({ length: emptySlots > 1 ? 1 : emptySlots }).map((_, i) => (
                <PhotoUploader
                  key={`empty-${i}`}
                  onPhotoUploaded={handleAddPhoto}
                  currentPhotoUrl={null}
                />
              ))}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          {SETTINGS.map((row) => (
            <TouchableOpacity
              key={row.label}
              style={styles.settingsRow}
              onPress={() => Alert.alert('Coming soon')}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIcon}>
                <Ionicons name={row.icon} size={20} color="#56423e" />
              </View>
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#89726d" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsIcon, styles.signOutIcon]}>
              <Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
            </View>
            <Text style={[styles.settingsLabel, styles.signOutLabel]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit primary photo modal */}
      <Modal visible={editPhotoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            <PhotoUploader
              onPhotoUploaded={handleAddPhoto}
              currentPhotoUrl={primaryPhotoUrl}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setEditPhotoModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  photoWrap: { width: 140, height: 140, marginBottom: 16 },
  heroPhoto: { width: 140, height: 140, borderRadius: 70 },
  heroPlaceholder: { backgroundColor: '#f0ede9', alignItems: 'center', justifyContent: 'center' },
  editBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9d3d2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 28, fontWeight: '700', color: '#1c1c19', marginBottom: 8 },
  premiumBadge: {
    backgroundColor: '#dbe3c5',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  premiumText: { fontSize: 11, fontWeight: '700', color: '#3a4a2a', letterSpacing: 1 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#f6f3ee',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#9d3d2c' },
  statLabel: { fontSize: 12, color: '#56423e', marginTop: 2 },

  // Identity Vault card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#89726d', marginBottom: 16 },
  loadingIndicator: { marginVertical: 8 },
  vaultRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vaultSlot: { alignItems: 'center', gap: 6 },
  vaultCircle: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  primaryRing: { borderWidth: 3, borderColor: '#9d3d2c' },
  vaultPhoto: { width: '100%', height: '100%' },
  vaultLabel: { fontSize: 11, color: '#56423e' },

  // Settings
  settingsSection: {
    marginHorizontal: 16,
    backgroundColor: '#f6f3ee',
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0ede9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: { backgroundColor: '#fdf0f0' },
  settingsLabel: { flex: 1, fontSize: 15, color: '#1c1c19' },
  signOutLabel: { color: '#ba1a1a' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 20,
    width: 300,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19' },
  modalClose: { paddingVertical: 8, paddingHorizontal: 24 },
  modalCloseText: { fontSize: 15, color: '#89726d' },
});
