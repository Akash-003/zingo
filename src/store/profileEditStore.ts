import { create } from 'zustand';

interface ProfileEditState {
  nameModalVisible: boolean;
  photoModalVisible: boolean;
  openNameModal: () => void;
  closeNameModal: () => void;
  openPhotoModal: () => void;
  closePhotoModal: () => void;
}

// Drives the single <ProfileEditModals /> mounted at the app root (see
// App.tsx) — same pattern as alertStore/<AppAlert/>. Modals triggered from
// inside a tab screen get clipped to that screen's native fragment on
// Android (react-native-screens), so they can't cover the custom bottom tab
// bar; mounting one shared instance outside the navigator avoids that.
export const useProfileEditStore = create<ProfileEditState>((set) => ({
  nameModalVisible: false,
  photoModalVisible: false,
  openNameModal: () => set({ nameModalVisible: true }),
  closeNameModal: () => set({ nameModalVisible: false }),
  openPhotoModal: () => set({ photoModalVisible: true }),
  closePhotoModal: () => set({ photoModalVisible: false }),
}));
