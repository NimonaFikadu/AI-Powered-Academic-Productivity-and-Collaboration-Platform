import { create } from 'zustand';
import i18n from 'i18next';

type LanguageStore = {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: i18n.language || 'en',
  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang);
    set({ currentLanguage: lang });
  },
})); 