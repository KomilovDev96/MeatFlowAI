import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

export const LANG_STORAGE_KEY = 'meatflow.lang';

const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
const initialLang = savedLang === 'ru' || savedLang === 'uz' ? savedLang : 'uz';

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: initialLang,
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: 'uz' | 'ru') {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

export default i18n;
