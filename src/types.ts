/**
 * Core type definitions for Sylva
 */
import { SupportedLanguage, TabType } from './theme';

export type SeverityLevel = 'low' | 'medium' | 'high';

export interface TreatmentPlan {
  action: string;
  category: 'immediate' | 'organic' | 'chemical' | 'preventative';
  dosage?: string;
  safeIntervalDays?: number;
}

export interface DiagnosisRecord {
  id: string;
  cropName: string;
  conditionName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'deficiency' | 'healthy';
  severity: SeverityLevel;
  confidence: number; // 0 - 100
  summary: string;
  actions: string[];
  imageUrl?: string;
  createdAt: string;
}

export interface WeatherCondition {
  temperatureC: number;
  humidityPct: number;
  condition: string;
  windSpeedKmh: number;
  rainRisk: SeverityLevel;
  fungalRisk: SeverityLevel;
  sprayAdvisory: string;
  lastUpdated: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  cropName: string;
  conditionName: string;
  severity: SeverityLevel;
  confidence: number;
  shortSummary: string;
  imageThumbnail?: string;
}

export type LeafMood = 'calm' | 'windy';

export interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  tabDirection: number; // 1 for right/down, -1 for left/up
  latestDiagnosis: DiagnosisRecord | null;
  setLatestDiagnosis: (diagnosis: DiagnosisRecord | null) => void;
  weather: WeatherCondition | null;
  setWeather: (weather: WeatherCondition | null) => void;
  scans: ScanHistoryItem[];
  addScan: (scan: ScanHistoryItem) => void;
  clearScans: () => void;
  leafMood: LeafMood;
  setLeafMood: (mood: LeafMood) => void;
  hasEnteredApp: boolean;
  enterApp: () => void;
  returnToLanding: () => void;
}
