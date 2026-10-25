import { ScanHistoryItem, SeverityLevel } from '../types';
import { TabType } from '../theme';

export const STORAGE_KEYS = {
  HAS_ENTERED_APP: 'sylva_has_entered_app_v1',
  SCANS: 'sylva_scans_history_v1',
  LANGUAGE: 'sylva_preferred_language_v1',
} as const;

export function getStoredHasEnteredApp(storage?: Storage): boolean {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return false;
    return s.getItem(STORAGE_KEYS.HAS_ENTERED_APP) === 'true';
  } catch {
    return false;
  }
}

export function setStoredHasEnteredApp(entered: boolean, storage?: Storage): void {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return;
    s.setItem(STORAGE_KEYS.HAS_ENTERED_APP, entered ? 'true' : 'false');
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function loadStoredScans(storage?: Storage): ScanHistoryItem[] {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return [];
    const raw = s.getItem(STORAGE_KEYS.SCANS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredScans(scans: ScanHistoryItem[], storage?: Storage): void {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return;
    s.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));
  } catch {
    // Ignore storage write issues
  }
}

const TAB_ORDER: TabType[] = ['scan', 'weather', 'field-log'];

export function getTabOrderIndex(tab: TabType): number {
  const idx = TAB_ORDER.indexOf(tab);
  return idx === -1 ? 0 : idx;
}

export function calculateTabDirection(prevTab: TabType, nextTab: TabType): number {
  const prevIdx = getTabOrderIndex(prevTab);
  const nextIdx = getTabOrderIndex(nextTab);
  if (prevIdx === nextIdx) return 0;
  return nextIdx > prevIdx ? 1 : -1;
}

export function getSeverityStyle(severity: SeverityLevel): {
  color: string;
  bg: string;
  border: string;
} {
  switch (severity) {
    case 'high':
      return {
        color: '#A8423F',
        bg: 'rgba(168, 66, 63, 0.12)',
        border: 'rgba(168, 66, 63, 0.3)',
      };
    case 'medium':
      return {
        color: '#C0772C',
        bg: 'rgba(192, 119, 44, 0.12)',
        border: 'rgba(192, 119, 44, 0.3)',
      };
    case 'low':
    default:
      return {
        color: '#34796E',
        bg: 'rgba(52, 121, 110, 0.12)',
        border: 'rgba(52, 121, 110, 0.25)',
      };
  }
}
