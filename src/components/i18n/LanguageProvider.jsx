import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from './index';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const RTL_LANGUAGES = ['ar'];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState(RTL_LANGUAGES.includes(i18n.language));

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
      setLanguageState(savedLanguage);
      setIsRTL(RTL_LANGUAGES.includes(savedLanguage));
      
      // Apply RTL if needed
      if (RTL_LANGUAGES.includes(savedLanguage)) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
  }, []);

  const setLanguage = async (lang) => {
    try {
      // Save to localStorage
      localStorage.setItem('appLanguage', lang);
      
      // Change i18n language
      await i18n.changeLanguage(lang);
      
      // Update state
      setLanguageState(lang);
      const rtl = RTL_LANGUAGES.includes(lang);
      setIsRTL(rtl);
      
      // Apply RTL direction
      if (rtl) {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value = {
    language,
    setLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};