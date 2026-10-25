import { DiagnosisRecord, ScanHistoryItem, SeverityLevel } from '../types';

export interface SampleLeaf {
  id: string;
  cropName: string;
  conditionName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'deficiency' | 'healthy';
  severity: SeverityLevel;
  confidence: number;
  summary: string;
  actions: string[];
  organicRemedy: string;
  preventativeAdvice: string;
  svgColor: string;
  spotColor: string;
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-tomato-blight',
    cropName: 'Tomato',
    conditionName: 'Early Blight (Alternaria solani)',
    category: 'fungal',
    severity: 'medium',
    confidence: 94.6,
    summary: 'Concentric brown target-like lesions on lower foliage indicative of Early Blight.',
    actions: [
      'Remove and safely discard affected lower leaves at the stem joint.',
      'Apply copper soap fungicide or Bacillus subtilis biocontrol in the early morning.',
      'Mulch soil around base to prevent fungal spores splashing from soil.',
    ],
    organicRemedy: 'Neem oil spray (5ml/L) combined with potassium bicarbonate (3g/L) every 7 days.',
    preventativeAdvice: 'Switch from overhead sprinklers to drip irrigation to keep canopy dry.',
    svgColor: '#4A7C59',
    spotColor: '#8B5A2B',
  },
  {
    id: 'sample-potato-late-blight',
    cropName: 'Potato',
    conditionName: 'Late Blight (Phytophthora infestans)',
    category: 'fungal',
    severity: 'high',
    confidence: 97.2,
    summary: 'Dark water-soaked lesions spreading rapidly with light fungal halo on margins.',
    actions: [
      'Immediately isolate the infected row and remove severely blighted vines.',
      'Apply systemic preventative fungicide or copper hydroxide promptly before rain.',
      'Inspect underside of leaves in adjacent rows for white sporulation.',
    ],
    organicRemedy: 'Copper oxychloride or Bordeaux mixture applied thoroughly under leaf surface.',
    preventativeAdvice: 'Plant certified disease-free seed tubers and maintain 75cm row spacing for airflow.',
    svgColor: '#5C8A66',
    spotColor: '#4A2810',
  },
  {
    id: 'sample-corn-rust',
    cropName: 'Maize / Corn',
    conditionName: 'Common Rust (Puccinia sorghi)',
    category: 'fungal',
    severity: 'low',
    confidence: 91.8,
    summary: 'Scattered small cinnamon-brown powdery pustules on upper leaf surface.',
    actions: [
      'Monitor weather: rust development slows dramatically if temperatures exceed 30°C.',
      'Ensure balanced nitrogen fertilization; avoid excessive vegetative surge.',
      'Scout field weekly to verify pustules do not exceed 5% canopy cover.',
    ],
    organicRemedy: 'Wettable sulfur dust or bio-fungicide foliar spray on newly emerging leaves.',
    preventativeAdvice: 'Select hybrid maize varieties with high genetic resistance for next sowing.',
    svgColor: '#6B8E23',
    spotColor: '#D2691E',
  },
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'];
  if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
    return { valid: false, error: 'Please choose an image file (JPEG, PNG, or WebP).' };
  }
  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Image exceeds 15MB. Please choose a smaller file.' };
  }
  return { valid: true };
}

export function createScanRecordFromDiagnosis(
  diagnosis: DiagnosisRecord,
  imageThumbnail?: string
): ScanHistoryItem {
  return {
    id: diagnosis.id || `scan-${Date.now()}`,
    timestamp: Date.now(),
    cropName: diagnosis.cropName,
    conditionName: diagnosis.conditionName,
    severity: diagnosis.severity,
    confidence: diagnosis.confidence,
    shortSummary: diagnosis.summary,
    imageThumbnail,
  };
}
