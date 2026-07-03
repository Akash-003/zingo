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
  supportsPersonalization: boolean;
  photoSlot: PhotoSlot | null;
  nameSlot: NameSlot | null;
}

interface CardsState {
  currentCategory: string;
  currentCardIndex: number;
  cards: Card[];

  setCurrentCategory: (category: string) => void;
  setCurrentCardIndex: (index: number) => void;
  setCards: (cards: Card[]) => void;
  appendCards: (cards: Card[]) => void;
  removeCard: (id: string) => void;
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
    set((state) => {
      const ids = new Set(state.cards.map((c) => c.id));
      return { cards: [...state.cards, ...newCards.filter((c) => !ids.has(c.id))] };
    }),
  removeCard: (id) => set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
  reset: () => set(initialState),
}));
