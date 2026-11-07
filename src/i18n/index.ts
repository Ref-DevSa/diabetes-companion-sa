import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zu from './zu.json';
import tn from './tn.json';
import { enabledLanguages, isLanguageCode, type LanguageCode } from './languages';

/** Where a Visitor's language choice is kept on the device (BR17). Not health data. */
export const VISITOR_LANGUAGE_KEY = 'dcsa.language';

function readSavedLanguage(): LanguageCode | null {
  try {
    const saved = window.localStorage.getItem(VISITOR_LANGUAGE_KEY);
    return isLanguageCode(saved) && enabledLanguages.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zu: { translation: zu },
    tn: { translation: tn },
  },
  lng: typeof window === 'undefined' ? 'en' : (readSavedLanguage() ?? 'en'),
  fallbackLng: ['en'],
  supportedLngs: ['en', 'zu', 'tn'],
  returnEmptyString: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});

/** Applies a language at once and remembers it on this device (Visitor choice, BR17). */
export async function chooseLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    window.localStorage.setItem(VISITOR_LANGUAGE_KEY, code);
  } catch {
    // Storage may be blocked; the choice still applies for this visit.
  }
}
