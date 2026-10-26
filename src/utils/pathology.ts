import { DiagnosisRecord, FoliarAnalysis, PathologyLesionZone, SeverityLevel } from '../types';

/**
 * Computes realistic foliar lesion geometry, surface necrosis percentage,
 * and chlorosis halos based on diagnosis severity, category, and crop type.
 */
export function computeFoliarAnalysis(
  conditionName: string,
  severity: SeverityLevel,
  cropName: string
): FoliarAnalysis {
  const isHigh = severity === 'high';
  const isMed = severity === 'medium';

  // Base calculations
  const damagePercentage = isHigh
    ? 38.0 + Math.round(((conditionName.length * 7) % 80)) / 10
    : isMed
    ? 22.0 + Math.round(((conditionName.length * 5) % 65)) / 10
    : 11.0 + Math.round(((conditionName.length * 3) % 40)) / 10;

  const necrosisPercentage = Math.round(damagePercentage * 0.58 * 10) / 10;
  const chlorosisPercentage = Math.round((damagePercentage - necrosisPercentage) * 10) / 10;
  const healthyPercentage = Math.round((100 - damagePercentage) * 10) / 10;

  // Calibrated lesion clusters for visual overlay (percentages of leaf canvas)
  const lesionClusters: PathologyLesionZone[] = [
    {
      id: 'lesion-1',
      xPct: 34,
      yPct: 42,
      radiusPct: isHigh ? 16 : 12,
      intensity: 0.92,
      zoneName: 'Central Lamina',
      description: 'Concentric necrotic ring with active fungal hyphae',
      severity: isHigh ? 'high' : 'medium',
    },
    {
      id: 'lesion-2',
      xPct: 62,
      yPct: 35,
      radiusPct: isHigh ? 14 : 10,
      intensity: 0.85,
      zoneName: 'Upper Right Margin',
      description: 'Water-soaked chlorotic lesion advancing toward tip',
      severity: isHigh ? 'high' : 'medium',
    },
    {
      id: 'lesion-3',
      xPct: 48,
      yPct: 68,
      radiusPct: isHigh ? 18 : 13,
      intensity: 0.88,
      zoneName: 'Lower Midrib Base',
      description: 'Deep necrotic core with surrounding yellow chlorosis halo',
      severity: isHigh ? 'high' : 'medium',
    },
    {
      id: 'lesion-4',
      xPct: 22,
      yPct: 58,
      radiusPct: isHigh ? 11 : 8,
      intensity: 0.65,
      zoneName: 'Left Outer Edge',
      description: 'Secondary sporulation pustule cluster',
      severity: isHigh ? 'medium' : 'low',
    },
    {
      id: 'lesion-5',
      xPct: 74,
      yPct: 62,
      radiusPct: isHigh ? 13 : 9,
      intensity: 0.72,
      zoneName: 'Right Lateral Vein',
      description: 'Vascular marginal discoloration',
      severity: isHigh ? 'medium' : 'low',
    },
  ];

  if (isHigh) {
    lesionClusters.push(
      {
        id: 'lesion-6',
        xPct: 42,
        yPct: 24,
        radiusPct: 12,
        intensity: 0.95,
        zoneName: 'Apical Foliar Tip',
        description: 'Severe tip blight with dry curling necrosis',
        severity: 'high',
      },
      {
        id: 'lesion-7',
        xPct: 55,
        yPct: 82,
        radiusPct: 10,
        intensity: 0.78,
        zoneName: 'Petiole Junction',
        description: 'Early vascular penetration threat',
        severity: 'medium',
      }
    );
  }

  return {
    damagePercentage,
    chlorosisPercentage,
    necrosisPercentage,
    healthyPercentage,
    lesionClusters,
    primaryPathogenStrain: `${conditionName} (${cropName})`,
    sporulationRisk: isHigh ? 'high' : isMed ? 'moderate' : 'low',
  };
}

export interface DemoPreset {
  id: string;
  badge: string;
  label: string;
  cropName: string;
  diseaseName: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'pest';
  severity: SeverityLevel;
  confidence: number;
  urgency: 'act_today' | 'act_this_week' | 'monitor';
  imagePath: string;
  damagePct: number;
  pitchKicker: string;
  summary: string;
  todaySteps: string[];
  thisWeekSteps: string[];
  preventNextSeason: string[];
}

export const HACKATHON_DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'preset-tomato-late-blight',
    badge: 'Critical Outbreak',
    label: 'Tomato · Late Blight',
    cropName: 'Tomato',
    diseaseName: 'Late Blight (Phytophthora infestans)',
    category: 'fungal',
    severity: 'high',
    confidence: 96.4,
    urgency: 'act_today',
    imagePath: '/samples/tomato_early_blight.jpg',
    damagePct: 42.6,
    pitchKicker: 'Rapid foliar spread with high sporulation risk under morning dew.',
    summary: 'Dark water-soaked lesions with chlorotic halos rapidly coalescing across the leaf surface. High danger to entire plot without immediate cultural pruning.',
    todaySteps: [
      'Immediately prune infected leaves and seal in bags away from fields.',
      'Stop all overhead watering; keep foliage completely dry.',
      'Sterilize pruning tools with 70% alcohol between cuts.',
    ],
    thisWeekSteps: [
      'Apply copper hydroxide or protective bio-fungicide in early morning window.',
      'Inspect adjacent plants within 5m radius for secondary pustules.',
    ],
    preventNextSeason: [
      'Rotate plot with non-solanaceous crops for at least 2 seasons.',
      'Increase planting distance to 60cm for maximum microclimate ventilation.',
    ],
  },
  {
    id: 'preset-potato-blight',
    badge: 'High Impact',
    label: 'Potato · Foliar Blight',
    cropName: 'Potato',
    diseaseName: 'Early Blight & Foliar Necrosis (Alternaria solani)',
    category: 'fungal',
    severity: 'high',
    confidence: 94.1,
    urgency: 'act_today',
    imagePath: '/samples/potato_late_blight.jpg',
    damagePct: 37.8,
    pitchKicker: 'Concentric target-spot lesions progressing along lower canopy.',
    summary: 'Concentric ring necrosis spreading through lower canopy leaves. Threat of yield reduction up to 35% if fungal sporulation spreads to main stems.',
    todaySteps: [
      'Strip infected lower leaves touching soil surface.',
      'Improve furrow drainage to eliminate stagnant ground moisture.',
    ],
    thisWeekSteps: [
      'Apply Bacillus subtilis or preventative copper spray during 6–9 AM spray window.',
      'Apply potassium silicate foliar wash to strengthen leaf cuticle.',
    ],
    preventNextSeason: [
      'Use certified disease-free seed tubers.',
      'Plant resistant cultivars with enhanced foliar resilience.',
    ],
  },
  {
    id: 'preset-corn-rust',
    badge: 'Fungal Vector',
    label: 'Maize · Common Rust',
    cropName: 'Maize / Corn',
    diseaseName: 'Common Rust (Puccinia sorghi)',
    category: 'fungal',
    severity: 'medium',
    confidence: 91.8,
    urgency: 'act_this_week',
    imagePath: '/samples/corn_common_rust.jpg',
    damagePct: 23.4,
    pitchKicker: 'Cinnamon-brown uredinial pustules rupturing upper epidermis.',
    summary: 'Elevated powdery rust pustules scattered along the leaf blade. Photosynthetic capacity is moderately reduced but treatable with IPM biologicals.',
    todaySteps: [
      'Mark affected plot sectors for targeted spot treatment.',
      'Check morning relative humidity and wind speed on Weather tab.',
    ],
    thisWeekSteps: [
      'Apply Trichoderma viride or wettable sulfur during calm morning window.',
      'Monitor flag leaves closely to protect developing ears.',
    ],
    preventNextSeason: [
      'Plant certified rust-resistant hybrid seed.',
      'Deep plow residue post-harvest to bury overwintering spores.',
    ],
  },
];

export function createDiagnosisFromPreset(preset: DemoPreset): DiagnosisRecord {
  const foliar = computeFoliarAnalysis(preset.diseaseName, preset.severity, preset.cropName);
  foliar.damagePercentage = preset.damagePct;

  return {
    id: `diag-preset-${preset.id}-${Date.now()}`,
    cropName: preset.cropName,
    conditionName: preset.diseaseName,
    category: preset.category,
    severity: preset.severity,
    confidence: preset.confidence,
    summary: preset.summary,
    actions: preset.todaySteps,
    urgency: preset.urgency,
    today_steps: preset.todaySteps,
    this_week_steps: preset.thisWeekSteps,
    prevent_next_season: preset.preventNextSeason,
    call_expert: preset.severity === 'high',
    imageUrl: preset.imagePath,
    createdAt: new Date().toISOString(),
    foliarAnalysis: foliar,
  };
}
