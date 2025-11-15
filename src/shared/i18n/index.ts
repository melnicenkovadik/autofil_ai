import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '../types/settings';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import ar from './locales/ar.json';
import id from './locales/id.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import it from './locales/it.json';
import pl from './locales/pl.json';
import be from './locales/be.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uk: { translation: uk },
  zh: { translation: zh },
  es: { translation: es },
  hi: { translation: hi },
  ar: { translation: ar },
  id: { translation: id },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja },
  it: { translation: it },
  pl: { translation: pl },
  be: { translation: be },
} as const;

const rtlLanguages: Language[] = ['ar'];

function applyDirection(language: Language | string | undefined) {
  if (typeof document === 'undefined') return;
  const lang = (language || 'en') as Language;
  const isRtl = rtlLanguages.includes(lang);
  const dir = isRtl ? 'rtl' : 'ltr';

  document.documentElement.setAttribute('dir', dir);
  document.body?.setAttribute('dir', dir);
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    applyDirection(i18n.language);
  });

// Load language from settings after initialization
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get('settings_v1', (result) => {
    if (result.settings_v1?.language) {
      i18n.changeLanguage(result.settings_v1.language);
      applyDirection(result.settings_v1.language);
    }
  });
}

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;
