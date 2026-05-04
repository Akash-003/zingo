import { create } from 'zustand';

export interface PhotoSlot {
  style: 'portrait' | 'circle';
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface NameSlot {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold';
}

export interface Card {
  id: string;
  imageUrl: string;
  category: string;
  isPremium: boolean;
  createdAt: number;
  photoSlot: PhotoSlot;
  nameSlot: NameSlot;
}

interface CardsState {
  currentCategory: string;
  currentCardIndex: number;
  cards: Card[];

  setCurrentCategory: (category: string) => void;
  setCurrentCardIndex: (index: number) => void;
  setCards: (cards: Card[]) => void;
  appendCards: (cards: Card[]) => void;
  reset: () => void;
}

const initialState = {
  currentCategory: 'all',
  currentCardIndex: 0,
  cards: [],
};

export const useCardsStore = create<CardsState>((set) => ({
  ...initialState,

  setCurrentCategory: (currentCategory) =>
    set({ currentCategory, currentCardIndex: 0, cards: [] }),
  setCurrentCardIndex: (currentCardIndex) => set({ currentCardIndex }),
  setCards: (cards) => set({ cards }),
  appendCards: (newCards) =>
    set((state) => ({ cards: [...state.cards, ...newCards] })),
  reset: () => set(initialState),
}));
