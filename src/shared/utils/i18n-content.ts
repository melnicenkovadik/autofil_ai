import enTranslations from '../i18n/locales/en.json';
import ruTranslations from '../i18n/locales/ru.json';
import ukTranslations from '../i18n/locales/uk.json';
import zhTranslations from '../i18n/locales/zh.json';
import esTranslations from '../i18n/locales/es.json';
import hiTranslations from '../i18n/locales/hi.json';
import arTranslations from '../i18n/locales/ar.json';
import idTranslations from '../i18n/locales/id.json';
import ptTranslations from '../i18n/locales/pt.json';
import frTranslations from '../i18n/locales/fr.json';
import deTranslations from '../i18n/locales/de.json';
import jaTranslations from '../i18n/locales/ja.json';
import itTranslations from '../i18n/locales/it.json';
import plTranslations from '../i18n/locales/pl.json';
import beTranslations from '../i18n/locales/be.json';
import type { Language } from '../types/settings';

const translations: Record<Language, typeof enTranslations> = {
  en: enTranslations,
  ru: ruTranslations as typeof enTranslations,
  uk: ukTranslations as typeof enTranslations,
  zh: zhTranslations as typeof enTranslations,
  es: esTranslations as typeof enTranslations,
  hi: hiTranslations as typeof enTranslations,
  ar: arTranslations as typeof enTranslations,
  id: idTranslations as typeof enTranslations,
  pt: ptTranslations as typeof enTranslations,
  fr: frTranslations as typeof enTranslations,
  de: deTranslations as typeof enTranslations,
  ja: jaTranslations as typeof enTranslations,
  it: itTranslations as typeof enTranslations,
  pl: plTranslations as typeof enTranslations,
  be: beTranslations as typeof enTranslations,
};

let currentLanguage: Language = 'en';
let isInitialized = false;

/**
 * Get translation for content scripts (non-React context)
 */
export async function getTranslation(key: string, params?: Record<string, string | number>): Promise<string> {
  // Load language from settings if not initialized
  if (!isInitialized && typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get('settings_v1');
      if (result.settings_v1?.language) {
        currentLanguage = result.settings_v1.language;
      }
      isInitialized = true;
    } catch (error) {
      console.error('Failed to load language', error);
      isInitialized = true; // Mark as initialized even on error
    }
  }

  const keys = key.split('.');
  let value: any = translations[currentLanguage] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key; // Return key if translation not found
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

/**
 * Initialize language from settings
 */
export async function initContentI18n(): Promise<void> {
  if (isInitialized) return;
  
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get('settings_v1');
      if (result.settings_v1?.language) {
        currentLanguage = result.settings_v1.language;
      }
    } catch (error) {
      console.error('Failed to load language', error);
    }
  }
  
  isInitialized = true;
}

