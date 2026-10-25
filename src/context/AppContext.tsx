import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppContextType,
  DiagnosisRecord,
  LeafMood,
  ScanHistoryItem,
  WeatherCondition,
} from '../types';
import { SupportedLanguage, TabType } from '../theme';
import {
  calculateTabDirection,
  getStoredHasEnteredApp,
  loadStoredScans,
  saveStoredScans,
  setStoredHasEnteredApp,
  STORAGE_KEYS,
} from '../utils/storage';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check autostart query param or stored entry state
  const [hasEnteredApp, setHasEnteredAppState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        return true;
      }
      return getStoredHasEnteredApp();
    }
    return false;
  });

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as SupportedLanguage | null;
      if (saved && ['en', 'hi', 'te', 'kn'].includes(saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const [activeTab, setActiveTabState] = useState<TabType>('scan');
  const [tabDirection, setTabDirection] = useState<number>(0);
  const [leafMood, setLeafMood] = useState<LeafMood>('calm');
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [scans, setScans] = useState<ScanHistoryItem[]>(() => loadStoredScans());

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch {
      // ignore
    }
  };

  const setActiveTab = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const dir = calculateTabDirection(activeTab, newTab);
    setTabDirection(dir);
    setActiveTabState(newTab);
  };

  const enterApp = () => {
    setHasEnteredAppState(true);
    setStoredHasEnteredApp(true);
  };

  const returnToLanding = () => {
    setHasEnteredAppState(false);
    setStoredHasEnteredApp(false);
  };

  const addScan = (newScan: ScanHistoryItem) => {
    setScans((prev) => {
      const updated = [newScan, ...prev];
      saveStoredScans(updated);
      return updated;
    });
  };

  const clearScans = () => {
    setScans([]);
    saveStoredScans([]);
  };

  // Sync to localStorage
  useEffect(() => {
    saveStoredScans(scans);
  }, [scans]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        activeTab,
        setActiveTab,
        tabDirection,
        latestDiagnosis,
        setLatestDiagnosis,
        weather,
        setWeather,
        scans,
        addScan,
        clearScans,
        leafMood,
        setLeafMood,
        hasEnteredApp,
        enterApp,
        returnToLanding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
