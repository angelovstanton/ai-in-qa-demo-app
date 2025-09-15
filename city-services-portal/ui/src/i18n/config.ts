import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// Import translation files
import enTranslations from './locales/en';
import bgTranslations from './locales/bg';

// Supported languages
export const supportedLanguages = {
  en: { name: 'English', flag: '🇬🇧', dateFormat: 'MM/DD/YYYY' },
  bg: { name: 'Български', flag: '🇧🇬', dateFormat: 'DD.MM.YYYY' }
};

export const defaultLanguage = 'en';
export const fallbackLanguage = 'en';

// Language detection options
const detectionOptions = {
  // Order and from where user language should be detected
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
  
  // Keys or params to lookup language from
  lookupLocalStorage: 'i18nextLng',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  
  // Cache user language
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
  
  // Optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement,
  
  // Only detect languages that are in the whitelist
  checkWhitelist: true
};

i18n
  // Load translations using http -> see /public/locales
  // Learn more: https://github.com/i18next/i18next-http-backend
  .use(HttpApi)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources: {
      en: enTranslations,
      bg: bgTranslations
    },
    fallbackLng: fallbackLanguage,
    debug: process.env.NODE_ENV === 'development',
    
    detection: detectionOptions,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    // Namespaces
    ns: [
      'common', 
      'auth', 
      'requests', 
      'navigation', 
      'validation', 
      'errors', 
      'status',
      'admin',
      'supervisor',
      'agent',
      'clerk',
      'dashboard',
      'notifications',
      'settings',
      'upload'
    ],
    defaultNS: 'common',
    
    // React options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
    }
  });

export default i18n;