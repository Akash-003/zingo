import { en } from './en';
import { hi } from './hi';
import { useLanguageStore, Language } from '../store/languageStore';

export type TranslationKey = keyof typeof en;

const catalogs: Record<Language, Record<TranslationKey, string>> = { en, hi };

/** Translate a key, replacing `{param}` placeholders from `params`. */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const strings = catalogs[useLanguageStore.getState().language];
  let value = strings[key];
  if (params) {
    for (const [name, v] of Object.entries(params)) {
      value = value.replace(`{${name}}`, String(v));
    }
  }
  return value;
}

/** Label for a card category id ('good-morning' → localized label). */
export function categoryLabel(id: string): string {
  const strings = catalogs[useLanguageStore.getState().language];
  const value = strings[`category.${id}` as TranslationKey] as string | undefined;
  return value ?? id;
}
