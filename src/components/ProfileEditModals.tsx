import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PhotoUploader from './PhotoUploader';
import { useProfileEditStore } from '../store/profileEditStore';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserStore } from '../store/userStore';
import { t } from '../i18n';

// Single mounted instance (see App.tsx) — same pattern as <AppAlert/>.
// Deliberately NOT RN's <Modal>: its Android Dialog window wasn't reliably
// painting above the custom bottom tab bar no matter where in the tree it
// was mounted. A plain absolute overlay in the same native window is
// governed by ordinary view stacking (later sibling + elevation), which
// can't have that problem.
export default function ProfileEditModals() {
  const insets = useSafeAreaInsets();
  const nameModalVisible = useProfileEditStore((s) => s.nameModalVisible);
  const photoModalVisible = useProfileEditStore((s) => s.photoModalVisible);
  const closeNameModal = useProfileEditStore((s) => s.closeNameModal);
  const closePhotoModal = useProfileEditStore((s) => s.closePhotoModal);

  const { updateName, addPhoto, setPrimaryPhoto, loading: profileLoading } = useUserProfile();
  const name = useUserStore((s) => s.name);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const [editNameValue, setEditNameValue] = useState(name);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (nameModalVisible) setEditNameValue(name);
  }, [nameModalVisible, name]);

  // Manual keyboard tracking instead of <KeyboardAvoidingView> — that
  // component was leaving a gap at the bottom of the screen (confirmed via
  // a full-bleed diagnostic color: the gap showed even with the keyboard
  // closed, ruling out padding/insets math and pointing at the component
  // itself on this Android + edgeToEdgeEnabled combo). Change Photo's sheet
  // never had this problem and never used KeyboardAvoidingView, so this
  // matches that same plain-View shape instead of fighting the component.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Not an RN <Modal>, so Android back doesn't auto-close it — handle it here.
  // Registered only while a sheet is visible, so it runs before any other
  // back handling (last-registered wins) and closes the sheet first.
  useEffect(() => {
    if (!nameModalVisible && !photoModalVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nameModalVisible) closeNameModal();
      else closePhotoModal();
      return true;
    });
    return () => sub.remove();
  }, [nameModalVisible, photoModalVisible, closeNameModal, closePhotoModal]);

  const handleSaveName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    await updateName(trimmed);
    closeNameModal();
  };

  const handlePhotoUploaded = async (url: string) => {
    closePhotoModal();
    await addPhoto(url);
    await setPrimaryPhoto(url);
  };

  if (!nameModalVisible && !photoModalVisible) return null;

  const sheetStyle = [styles.modalSheet, { paddingBottom: 10 + insets.bottom }];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {nameModalVisible && (
        <View style={[styles.modalBackdrop, { marginBottom: keyboardHeight }]}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={closeNameModal}
          />
          <View style={sheetStyle}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('editProfile.nameTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('editProfile.nameSubtitle')}</Text>
            <TextInput
              style={styles.nameInput}
              value={editNameValue}
              onChangeText={setEditNameValue}
              placeholder={t('editProfile.namePlaceholder')}
              placeholderTextColor="rgba(86,66,62,0.4)"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeNameModal}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, profileLoading && styles.modalBtnDisabled]}
                onPress={handleSaveName}
                disabled={profileLoading}
              >
                {profileLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {photoModalVisible && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={closePhotoModal}
          />
          <View style={sheetStyle}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('editProfile.photoTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('editProfile.photoSubtitle')}</Text>
            <View style={styles.uploaderWrap}>
              <PhotoUploader onPhotoUploaded={handlePhotoUploaded} currentPhotoUrl={primaryPhotoUrl} />
            </View>
            <TouchableOpacity style={styles.modalCancelStandalone} onPress={closePhotoModal}>
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c19',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#56423e',
    marginBottom: 20,
    lineHeight: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e0d8d0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1c1c19',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 99,
    backgroundColor: '#9d3d2c',
    alignItems: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#56423e',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  uploaderWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCancelStandalone: {
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
  },
});
