import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useUserStore } from '../../store/userStore';
import { useLanguageStore } from '../../store/languageStore';
import { useUserProfile } from '../../hooks/useUserProfile';
import { showAlert } from '../../store/alertStore';
import PhotoUploader from '../../components/PhotoUploader';
import { t } from '../../i18n';

export default function ProfileScreen() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  // Built per render (not module scope) so it reflects an in-app language
  // change without needing an app restart — see src/store/languageStore.ts.
  const STATS = [
    { label: t('profile.statCollections'), value: '0' },
    { label: t('profile.statFollowers'), value: '0' },
    { label: t('profile.statSaved'), value: '0' },
    { label: t('profile.statFeatured'), value: '0' },
  ];
  const SETTINGS = [
    { id: 'notifications', icon: 'notifications-outline' as const, label: t('profile.notifications') },
    { id: 'language', icon: 'language-outline' as const, label: t('profile.language') },
    { id: 'privacy', icon: 'lock-closed-outline' as const, label: t('profile.privacy') },
  ];
  const [editPhotoModal, setEditPhotoModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const navigation = useNavigation();

  const name = useUserStore((s) => s.name);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const photos = useUserStore((s) => s.photos);
  const isPremium = useUserStore((s) => s.isPremium);

  const { loading, addPhoto, setPrimaryPhoto, signOut } = useUserProfile();

  const handleAddPhoto = async (url: string) => {
    setEditPhotoModal(false);
    await addPhoto(url);
  };

  const handleHeroPhotoUploaded = async (url: string) => {
    setEditPhotoModal(false);
    await addPhoto(url);
    await setPrimaryPhoto(url);
  };

  const handleSetPrimary = async (url: string) => {
    await setPrimaryPhoto(url);
  };

  const handleSignOut = () => {
    showAlert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const emptySlots = Math.max(0, 5 - photos.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.getParent()?.navigate('Discover' as never)}>
        <Ionicons name="chevron-back" size={24} color="#1c1c19" />
      </TouchableOpacity>
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
              <Text style={styles.premiumText}>{t('profile.premiumBadge')}</Text>
            </View>
          )}
        </View>

        {/* Premium subscription card — only for premium members */}
        {isPremium && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Subscription' as never)}
          >
            <LinearGradient
              colors={['#9d3d2c', '#bd5541']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard}
            >
              <View style={styles.premiumCardIcon}>
                <Ionicons name="star" size={22} color="#fff" />
              </View>
              <View style={styles.premiumCardText}>
                <Text style={styles.premiumCardTitle}>Zingo Premium</Text>
                <Text style={styles.premiumCardSubtitle}>{t('profile.manageSubscription')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

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
          <Text style={styles.cardTitle}>{t('profile.identityVault')}</Text>
          <Text style={styles.cardSubtitle}>{t('profile.vaultSubtitle')}</Text>

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
                  <View style={styles.vaultCircle}>
                    <View style={styles.vaultPhotoWrap}>
                      <Image source={{ uri: url }} style={styles.vaultPhoto} />
                    </View>
                    {isPrimary && <View style={styles.primaryRing} pointerEvents="none" />}
                  </View>
                  <Text style={styles.vaultLabel}>{isPrimary ? t('profile.primary') : t('profile.setPrimary')}</Text>
                </TouchableOpacity>
              );
            })}

            {photos.length < 5 &&
              Array.from({ length: emptySlots }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.vaultSlot}>
                  <PhotoUploader
                    onPhotoUploaded={handleAddPhoto}
                    currentPhotoUrl={null}
                    size={54}
                  />
                  <Text style={styles.vaultLabel}>{t('profile.add')}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          {SETTINGS.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={styles.settingsRow}
              onPress={() => {
                if (row.id === 'notifications') {
                  void Linking.openSettings();
                } else if (row.id === 'language') {
                  setLanguageModal(true);
                } else {
                  showAlert(row.label, t('profile.comingSoon'));
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIcon}>
                <Ionicons name={row.icon} size={20} color="#56423e" />
              </View>
              <Text style={styles.settingsLabel}>{row.label}</Text>
              {row.id === 'language' && (
                <Text style={styles.settingsValue}>
                  {language === 'hi' ? 'हिन्दी' : 'English'}
                </Text>
              )}
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
            <Text style={[styles.settingsLabel, styles.signOutLabel]}>{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && (
          <View style={styles.adminSection}>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('CardReview' as never)}
              activeOpacity={0.6}
            >
              <Text style={styles.adminLinkText}>Admin: Review Card Name Slots</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('NameSlotAdjust' as never)}
              activeOpacity={0.6}
            >
              <Text style={styles.adminLinkText}>Admin: Adjust Name Positions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('PhotoSlotAdjust' as never)}
              activeOpacity={0.6}
            >
              <Text style={styles.adminLinkText}>Admin: Adjust Photo Positions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit primary photo modal */}
      <Modal
        visible={editPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditPhotoModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('profile.updatePhotoTitle')}</Text>
            <PhotoUploader
              onPhotoUploaded={handleHeroPhotoUploaded}
              currentPhotoUrl={primaryPhotoUrl}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setEditPhotoModal(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>

      {/* Language modal */}
      <Modal
        visible={languageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('profile.chooseLanguage')}</Text>
              <View style={styles.languageOptions}>
                <TouchableOpacity
                  style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
                  onPress={() => {
                    setLanguage('en');
                    setLanguageModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      language === 'en' && styles.languageOptionTextActive,
                    ]}
                  >
                    English
                  </Text>
                  {language === 'en' && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, language === 'hi' && styles.languageOptionActive]}
                  onPress={() => {
                    setLanguage('hi');
                    setLanguageModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      language === 'hi' && styles.languageOptionTextActive,
                    ]}
                  >
                    हिन्दी
                  </Text>
                  {language === 'hi' && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  backButton: { position: 'absolute', top: 50, left: 10, zIndex: 10, padding: 6 },
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

  // Premium subscription card
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  premiumCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCardText: { flex: 1 },
  premiumCardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  premiumCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

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
  vaultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vaultSlot: { alignItems: 'center', gap: 6 },
  vaultCircle: { width: 54, height: 54 },
  primaryRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 27, borderWidth: 3, borderColor: '#9d3d2c' },
  vaultPhotoWrap: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden' },
  vaultPhoto: { width: 54, height: 54 },
  vaultLabel: { fontSize: 10, color: '#56423e' },

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
  settingsValue: { fontSize: 13, color: '#89726d', marginRight: 8 },
  signOutLabel: { color: '#ba1a1a' },
  adminSection: { alignItems: 'center', paddingVertical: 12, gap: 4 },
  adminLink: { alignItems: 'center', paddingVertical: 8 },
  adminLinkText: { fontSize: 12, color: '#c8b5af' },

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

  // Language modal
  languageOptions: { width: '100%', gap: 10 },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#89726d',
    backgroundColor: '#ffffff',
  },
  languageOptionActive: {
    backgroundColor: '#9d3d2c',
    borderColor: '#9d3d2c',
  },
  languageOptionText: { fontSize: 15, fontWeight: '600', color: '#56423e' },
  languageOptionTextActive: { color: '#ffffff' },
});
