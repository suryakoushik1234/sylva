import { ScanHistoryItem, SeverityLevel, UrgencyLevel } from '../types';
import { TabType } from '../theme';

export const STORAGE_KEYS = {
  HAS_ENTERED_APP: 'sylva_has_entered_app_v1',
  SCANS: 'sylva_scans_history_v1',
  LANGUAGE: 'sylva_preferred_language_v1',
  STEP_TICKS: 'sylva_step_ticks_v1',
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

export const DEFAULT_INDIAN_SCANS: ScanHistoryItem[] = [
  {
    id: 'scan-rice-blight',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    cropName: 'Rice / Paddy',
    conditionName: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    severity: 'high',
    confidence: 94.2,
    shortSummary: 'Water-soaked wavy lesions progressing down the leaf blades from tips, typical of paddy bacterial blight in humid conditions.',
    urgency: 'act_today',
    today_steps: [
      'Drain standing water from the paddy basin for 48 hours to retard bacterial multiplication across rows.',
      'Temporarily stop top-dressing with nitrogenous urea fertilizer.',
    ],
    this_week_steps: [
      'Apply copper hydroxide or recommended bactericide strictly following local agricultural extension guidelines.',
      'Check irrigation channel bunds to avoid cross-field water overflow.',
    ],
    prevent_next_season: [
      'Plant BLB-resistant certified paddy varieties such as Improved Samba Mahsuri or PR 126.',
      'Treat nursery seeds with Trichoderma viride or hot water soaking prior to sowing.',
    ],
    call_expert: true,
    completedSteps: { 'today-0': true },
    imageThumbnail: '/samples/potato_late_blight.jpg',
  },
  {
    id: 'scan-cotton-curl',
    timestamp: Date.now() - 1000 * 60 * 60 * 22, // Yesterday
    cropName: 'Cotton',
    conditionName: 'Cotton Leaf Curl Virus (CLCuV) & Whitefly',
    severity: 'medium',
    confidence: 91.8,
    shortSummary: 'Upward cupping and thickening of leaf veins with leaf-like enations on undersides caused by whitefly vectors.',
    urgency: 'act_this_week',
    today_steps: [
      'Erect yellow sticky traps (15-20 traps per acre) at crop canopy level to trap flying whitefly vectors.',
      'Uproot and bury severely stunted seedlings showing early enations away from the field.',
    ],
    this_week_steps: [
      'Apply neem seed kernel extract (NSKE 5%) or horticultural potassium oil spray during the calm early morning window.',
      'Refrain from synthetic pyrethroids which decimate natural predator ladybird beetles.',
    ],
    prevent_next_season: [
      'Destroy weed hosts (Abutilon / Parthenium) on field borders well before seasonal sowing.',
      'Adopt recommended CLCuD-tolerant cotton hybrids suited to your agro-climatic zone.',
    ],
    call_expert: false,
    completedSteps: { 'today-0': true, 'today-1': false },
    imageThumbnail: '/samples/corn_common_rust.jpg',
  },
  {
    id: 'scan-mustard-rust',
    timestamp: Date.now() - 1000 * 60 * 60 * 46, // 2 days ago
    cropName: 'Mustard',
    conditionName: 'White Rust (Albugo candida)',
    severity: 'medium',
    confidence: 89.5,
    shortSummary: 'Distinct creamy white pustules on the abaxial leaf surface with chlorotic yellowing on the upper leaf surface.',
    urgency: 'act_this_week',
    today_steps: [
      'Clip and safely bag lower senescing leaves showing dense white blisters before spores aerosolize.',
      'Thin dense canopy clusters to enhance sunlight penetration and aeration.',
    ],
    this_week_steps: [
      'Spray wettable sulfur or protective bio-fungicide during the calm morning spray window.',
      'Inspect siliquae (pods) for floral staghead malformation.',
    ],
    prevent_next_season: [
      'Follow 2-year crop rotation with non-brassica crops like chickpea or wheat.',
      'Deep summer ploughing to expose resting oospores to solar heat.',
    ],
    call_expert: false,
    completedSteps: {},
    imageThumbnail: '/samples/tomato_early_blight.jpg',
  },
  {
    id: 'scan-wheat-rust',
    timestamp: Date.now() - 1000 * 60 * 60 * 78, // 3 days ago
    cropName: 'Wheat',
    conditionName: 'Yellow / Stripe Rust (Puccinia striiformis)',
    severity: 'high',
    confidence: 95.1,
    shortSummary: 'Linear stripes of bright yellow-orange powdery pustules along leaf veins disrupting grain filling.',
    urgency: 'act_today',
    today_steps: [
      'Identify and isolate the initial yellow rust foci in the field.',
      'Report sighting to your local Agriculture Extension Officer or agronomy specialist.',
    ],
    this_week_steps: [
      'Apply authorized triazole-class preventative spray solely on infected micro-patches during recommended wind window.',
      'Ensure irrigation does not create persistent evening canopy fog.',
    ],
    prevent_next_season: [
      'Sow stripe-rust resistant cultivars such as HD 3086, DBW 187, or PBW 725.',
      'Avoid delayed planting in humid sub-mountainous or river basin regions.',
    ],
    call_expert: true,
    completedSteps: { 'today-0': true },
    imageThumbnail: '/samples/corn_common_rust.jpg',
  },
  {
    id: 'scan-tomato-blight',
    timestamp: Date.now() - 1000 * 60 * 60 * 96, // 4 days ago
    cropName: 'Tomato',
    conditionName: 'Early Blight (Alternaria solani)',
    severity: 'medium',
    confidence: 93.4,
    shortSummary: 'Characteristic target-board concentric rings with yellow chlorotic margins on lower foliage.',
    urgency: 'act_this_week',
    today_steps: [
      'Prune lower infected foliage up to 20cm above the soil bed and discard off-site.',
      'Sterilize shears with 70% alcohol solution between plant cuts.',
    ],
    this_week_steps: [
      'Apply bio-fungicide (Bacillus subtilis) or copper hydroxide protectant in optimal spray window.',
      'Switch to furrow or drip irrigation to keep leaf surfaces dry.',
    ],
    prevent_next_season: [
      'Rotate plot with non-solanaceous crops (maize, pulses, or mustard) next season.',
      'Apply organic straw mulch to curb rain splash inoculation from soil.',
    ],
    call_expert: false,
    completedSteps: { 'today-0': true, 'today-1': true },
    imageThumbnail: '/samples/tomato_early_blight.jpg',
  },
];

export function loadStoredScans(storage?: Storage): ScanHistoryItem[] {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return DEFAULT_INDIAN_SCANS;
    const raw = s.getItem(STORAGE_KEYS.SCANS);
    if (!raw) {
      // Store initial default field records so the user immediately has realistic data
      s.setItem(STORAGE_KEYS.SCANS, JSON.stringify(DEFAULT_INDIAN_SCANS));
      return DEFAULT_INDIAN_SCANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Sanitize any lingering vernacular scripts from previous session
      return parsed.map((item) => {
        let cleanCrop = item.cropName || '';
        let cleanCondition = item.conditionName || '';
        cleanCrop = cleanCrop.replace(/\s*\([^)]*[\u0900-\u097F]+[^)]*\)/g, '').trim();
        cleanCondition = cleanCondition.replace(/\s*\([^)]*[\u0900-\u097F]+[^)]*\)/g, '').trim();
        cleanCondition = cleanCondition.replace(/[\u0900-\u097F]+\s*[-/]?\s*/g, '').trim();
        return {
          ...item,
          cropName: cleanCrop || item.cropName,
          conditionName: cleanCondition || item.conditionName,
        };
      });
    }
    return DEFAULT_INDIAN_SCANS;
  } catch {
    return DEFAULT_INDIAN_SCANS;
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

export function loadStoredStepTicks(storage?: Storage): Record<string, Record<string, boolean>> {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return {};
    const raw = s.getItem(STORAGE_KEYS.STEP_TICKS);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveStoredStepTicks(
  ticks: Record<string, Record<string, boolean>>,
  storage?: Storage
): void {
  try {
    const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return;
    s.setItem(STORAGE_KEYS.STEP_TICKS, JSON.stringify(ticks));
  } catch {
    // Ignore storage issues
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

export function getUrgencyStyle(urgency: UrgencyLevel): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  switch (urgency) {
    case 'act_today':
      return {
        label: 'Act Today',
        color: '#A8423F',
        bg: 'rgba(168, 66, 63, 0.12)',
        border: 'rgba(168, 66, 63, 0.3)',
      };
    case 'act_this_week':
      return {
        label: 'Act This Week',
        color: '#C0772C',
        bg: 'rgba(192, 119, 44, 0.12)',
        border: 'rgba(192, 119, 44, 0.3)',
      };
    case 'monitor':
    default:
      return {
        label: 'Monitor',
        color: '#34796E',
        bg: 'rgba(52, 121, 110, 0.12)',
        border: 'rgba(52, 121, 110, 0.25)',
      };
  }
}
