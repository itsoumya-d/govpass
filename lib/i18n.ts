import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import es from '../locales/es.json';
import hi from '../locales/hi.json';
import zh from '../locales/zh.json';
import ar from '../locales/ar.json';
import pt from '../locales/pt.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

const LANGUAGE_KEY = '@govpass_language';

const resources = {
  en: { translation: en },
  es: { translation: es },
  hi: { translation: hi },
  zh: { translation: zh },
  ar: { translation: ar },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja },
  ko: { translation: ko },
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLngs = Object.keys(resources);
const fallbackLng = 'en';

export async function initI18n() {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY).catch(() => null);
  const lng = stored && supportedLngs.includes(stored) ? stored : (supportedLngs.includes(deviceLocale) ? deviceLocale : fallbackLng);

  await i18n.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    resources,
    lng,
    fallbackLng,
    interpolation: { escapeValue: false },
  });
}

export async function changeLanguage(lang: string) {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
