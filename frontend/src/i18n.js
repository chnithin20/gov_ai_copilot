import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import te from './locales/te/translation.json';
import ta from './locales/ta/translation.json';
import hi from './locales/hi/translation.json';
import pb from './locales/pb/translation.json';
import gu from './locales/gu/translation.json';
import bn from './locales/bn/translation.json';
import mr from './locales/mr/translation.json';
import kn from './locales/kn/translation.json';
import ml from './locales/ml/translation.json';
import ur from './locales/ur/translation.json';
import or from './locales/or/translation.json';

const resources = {
  en: { translation: en },
  te: { translation: te },
  ta: { translation: ta },
  hi: { translation: hi },
  pb: { translation: pb },
  gu: { translation: gu },
  bn: { translation: bn },
  mr: { translation: mr },
  kn: { translation: kn },
  ml: { translation: ml },
  ur: { translation: ur },
  or: { translation: or }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
