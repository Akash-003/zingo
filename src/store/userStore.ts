import { create } from 'zustand';

interface UserState {
  uid: string | null;
  name: string;
  primaryPhotoUrl: string | null;
  photos: string[];
  isPremium: boolean;

  setUid: (uid: string | null) => void;
  setName: (name: string) => void;
  setPrimaryPhotoUrl: (url: string | null) => void;
  setPhotos: (photos: string[]) => void;
  setIsPremium: (isPremium: boolean) => void;
  reset: () => void;
}

const initialState = {
  uid: null,
  name: '',
  primaryPhotoUrl: null,
  photos: [],
  isPremium: false,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setUid: (uid) => set({ uid }),
  setName: (name) => set({ name }),
  setPrimaryPhotoUrl: (primaryPhotoUrl) => set({ primaryPhotoUrl }),
  setPhotos: (photos) => set({ photos }),
  setIsPremium: (isPremium) => set({ isPremium }),
  reset: () => set(initialState),
}));
