import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppContextType,
  DiagnosisRecord,
  EvaluatedSprayWindow,
  LeafMood,
  ScanHistoryItem,
  WeatherCondition,
} from '../types';
import { SupportedLanguage, TabType } from '../theme';
import {
  calculateTabDirection,
  getStoredHasEnteredApp,
  loadStoredScans,
  loadStoredStepTicks,
  saveStoredScans,
  saveStoredStepTicks,
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
  const [evaluatedSprayWindow, setEvaluatedSprayWindow] = useState<EvaluatedSprayWindow | null>(null);
  const [scans, setScans] = useState<ScanHistoryItem[]>(() => loadStoredScans());
  const [stepTicks, setStepTicks] = useState<Record<string, Record<string, boolean>>>(() =>
    loadStoredStepTicks()
  );

  // Floating Chatbot State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

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
    setStepTicks({});
    saveStoredStepTicks({});
  };

  const toggleStepCompletion = (scanId: string, stepKey: string) => {
    setStepTicks((prev) => {
      const currentScanTicks = prev[scanId] || {};
      const updatedScanTicks = {
        ...currentScanTicks,
        [stepKey]: !currentScanTicks[stepKey],
      };
      const updatedAll = {
        ...prev,
        [scanId]: updatedScanTicks,
      };
      saveStoredStepTicks(updatedAll);
      return updatedAll;
    });
  };

  const getCompletedSteps = (scanId: string): Record<string, boolean> => {
    return stepTicks[scanId] || {};
  };

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sylva_theme_v1');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  // Sync theme class to documentElement
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Listen to OS theme changes if user hasn't explicitly set preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('sylva_theme_v1');
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('sylva_theme_v1', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const openChatWithPrompt = (prompt?: string) => {
    if (prompt) {
      setPendingChatPrompt(prompt);
    }
    setIsChatOpen(true);
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
        theme,
        setTheme,
        toggleTheme,
        activeTab,
        setActiveTab,
        tabDirection,
        latestDiagnosis,
        setLatestDiagnosis,
        weather,
        setWeather,
        evaluatedSprayWindow,
        setEvaluatedSprayWindow,
        scans,
        addScan,
        clearScans,
        toggleStepCompletion,
        getCompletedSteps,
        leafMood,
        setLeafMood,
        hasEnteredApp,
        enterApp,
        returnToLanding,
        isChatOpen,
        setIsChatOpen,
        pendingChatPrompt,
        setPendingChatPrompt,
        openChatWithPrompt,
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
