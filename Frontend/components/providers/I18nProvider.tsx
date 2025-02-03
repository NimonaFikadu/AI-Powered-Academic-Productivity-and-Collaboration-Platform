'use client';

import { useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from '@/constants/locales/en';
import { am } from '@/constants/locales/am';
import { om } from '@/constants/locales/om';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // This ensures i18next is initialized on the client side
    if (!i18n.isInitialized) {
      i18n.init();
    }
  }, []);

  return <>{children}</>;
} 