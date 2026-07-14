import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export type Language = 'en' | 'hi';

const STORAGE_KEY = 'zingo.language';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

function detectDeviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'hi' ? 'hi' : 'en';
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: detectDeviceLanguage(),
  setLanguage: (language) => {
    set({ language });
    void AsyncStorage.setItem(STORAGE_KEY, language);
  },
}));

// ponytail: fire-and-forget hydration — a previously saved explicit choice
// overrides the device-locale guess above once AsyncStorage resolves.
void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved === 'en' || saved === 'hi') {
    useLanguageStore.setState({ language: saved });
  }
});
