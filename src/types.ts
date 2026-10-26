/**
 * Core type definitions for Sylva
 */
import { SupportedLanguage, TabType } from './theme';

export type SeverityLevel = 'low' | 'medium' | 'high';
export type UrgencyLevel = 'act_today' | 'act_this_week' | 'monitor';

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
  urgency: UrgencyLevel;
  today_steps: string[];
  this_week_steps: string[];
  prevent_next_season: string[];
  call_expert: boolean;
  completedSteps?: Record<string, boolean>;
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

export interface SprayWindowHour {
  time: string;
  hourLabel: string;
  tempC: number;
  rainProb: number;
  windKmh: number;
  quality: 'optimal' | 'moderate' | 'poor';
  reason: string;
  inBestWindow?: boolean;
}

export interface EvaluatedSprayWindow {
  title: string;
  subtitle: string;
  status: 'optimal' | 'moderate' | 'poor';
  bestWindowTime: string;
  bestWindowReason: string;
  isFallbackLeastBad?: boolean;
  missedRuleExplanation?: string;
  hourlyTimeline: SprayWindowHour[];
  currentTemp: number;
  currentWind: number;
  currentRainRisk: SeverityLevel;
  locationName: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  cropName: string;
  conditionName: string;
  severity: SeverityLevel;
  confidence: number;
  shortSummary: string;
  urgency?: UrgencyLevel;
  today_steps?: string[];
  this_week_steps?: string[];
  prevent_next_season?: string[];
  call_expert?: boolean;
  completedSteps?: Record<string, boolean>;
  imageThumbnail?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  evaluatedSprayWindow: EvaluatedSprayWindow | null;
  setEvaluatedSprayWindow: (window: EvaluatedSprayWindow | null) => void;
  scans: ScanHistoryItem[];
  addScan: (scan: ScanHistoryItem) => void;
  clearScans: () => void;
  toggleStepCompletion: (scanId: string, stepKey: string) => void;
  getCompletedSteps: (scanId: string) => Record<string, boolean>;
  leafMood: LeafMood;
  setLeafMood: (mood: LeafMood) => void;
  hasEnteredApp: boolean;
  enterApp: () => void;
  returnToLanding: () => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  openChatWithPrompt: (prompt?: string) => void;
}
