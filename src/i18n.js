import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import fil from './locales/fil.json';
import bn from './locales/bn.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    fil: { translation: fil },
    bn: { translation: bn },
  },
  lng: 'en',
  fallbackLng: 'en',
});

export default i18n;