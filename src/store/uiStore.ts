import { create } from 'zustand';

type Modal = 'paywall' | 'editName' | null;

interface UiState {
  isLoading: boolean;
  activeModal: Modal;

  setLoading: (isLoading: boolean) => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isLoading: false,
  activeModal: null,

  setLoading: (isLoading) => set({ isLoading }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}));
