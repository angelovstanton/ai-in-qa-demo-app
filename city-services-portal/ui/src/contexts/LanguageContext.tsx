import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type SupportedLanguage = 'en' | 'bg';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  isChangingLanguage: boolean;
  supportedLanguages: Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    // Check localStorage first, then browser language, default to 'en'
    const saved = localStorage.getItem('language') as SupportedLanguage;
    if (saved && ['en', 'bg'].includes(saved)) {
      return saved;
    }
    
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'bg') {
      return 'bg';
    }
    
    return 'en';
  });
  
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const supportedLanguages = [
    {
      code: 'en' as SupportedLanguage,
      name: 'English',
      nativeName: 'English',
      flag: 'EN'
    },
    {
      code: 'bg' as SupportedLanguage,
      name: 'Bulgarian',
      nativeName: 'Български',
      flag: '🇧🇬'
    }
  ];

  // Initialize i18n with saved language on mount
  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
    document.documentElement.lang = currentLanguage;
    
    // Update document direction for potential RTL languages (not needed for en/bg)
    document.documentElement.dir = 'ltr';
  }, []);

  const changeLanguage = async (language: SupportedLanguage) => {
    if (language === currentLanguage) return;
    
    setIsChangingLanguage(true);
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
      
      // Dispatch custom event for components that need to react to language changes
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isChangingLanguage,
    supportedLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};