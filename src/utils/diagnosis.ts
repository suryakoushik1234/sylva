import { DiagnosisRecord, ScanHistoryItem, SeverityLevel, UrgencyLevel } from '../types';

export interface RealSampleLeaf {
  id: string;
  cropName: string;
  imagePath: string;
  label: string;
  hint: string;
}

export const REAL_SAMPLE_LEAVES: RealSampleLeaf[] = [
  {
    id: 'sample-tomato-blight',
    cropName: 'Tomato',
    imagePath: '/samples/tomato_early_blight.jpg',
    label: 'Tomato Foliage',
    hint: 'Alternaria solani concentric leaf spots',
  },
  {
    id: 'sample-potato-blight',
    cropName: 'Potato',
    imagePath: '/samples/potato_late_blight.jpg',
    label: 'Potato Leaf',
    hint: 'Phytophthora infestans water-soaked lesions',
  },
  {
    id: 'sample-corn-rust',
    cropName: 'Maize / Corn',
    imagePath: '/samples/corn_common_rust.jpg',
    label: 'Corn Leaf',
    hint: 'Puccinia sorghi cinnamon pustules',
  },
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'];
  if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
    return { valid: false, error: 'Please choose an image file (JPEG, PNG, or WebP).' };
  }
  const maxBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Image exceeds 20MB. Please choose a smaller file.' };
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
    urgency: diagnosis.urgency,
    today_steps: diagnosis.today_steps,
    this_week_steps: diagnosis.this_week_steps,
    prevent_next_season: diagnosis.prevent_next_season,
    call_expert: diagnosis.call_expert,
    completedSteps: diagnosis.completedSteps || {},
    imageThumbnail,
  };
}

export function buildShareSummary(
  diagnosis: {
    cropName: string;
    conditionName: string;
    severity: string;
    today_steps?: string[];
    actions?: string[];
  },
  _language: string = 'en',
  siteUrl?: string
): string {
  const currentOrigin =
    siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://sylva.app');
  const firstStep =
    diagnosis.today_steps?.[0] || diagnosis.actions?.[0] || 'Inspect foliage carefully';

  return `Sylva diagnosis / Crop: ${diagnosis.cropName} / Problem: ${diagnosis.conditionName} (${diagnosis.severity} severity) / First step: ${firstStep} / Follow the product label and confirm with your local agri officer / KVK. / ${currentOrigin}`;
}

export async function shareDiagnosisResult(
  diagnosis: {
    cropName: string;
    conditionName: string;
    severity: string;
    today_steps?: string[];
    actions?: string[];
  },
  language: string = 'en'
): Promise<'shared' | 'copied' | 'opened_whatsapp'> {
  const summaryText = buildShareSummary(diagnosis, language);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Sylva Diagnosis - ${diagnosis.cropName}`,
        text: summaryText,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  // Open WhatsApp or copy fallback
  try {
    const encoded = encodeURIComponent(summaryText);
    const waUrl = `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return 'opened_whatsapp';
  } catch {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(summaryText);
      return 'copied';
    }
    return 'copied';
  }
}

export function generateRecheckICS(cropName: string): string {
  const checkDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtStart = formatDate(checkDate);
  const dtEnd = formatDate(new Date(checkDate.getTime() + 30 * 60 * 1000));
  const uid = `sylva-recheck-${Date.now()}@sylva.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sylva//Crop Health Advisory//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Re-check ${cropName || 'crop'} - Sylva`,
    `DESCRIPTION:Follow-up inspection for ${cropName || 'crop'} treatment progress. Inspect new foliage growth and confirm absence of active sporulation. Follow the product label and confirm with your local agri officer / KVK.`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder to re-check crop with Sylva',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadCalendarEvent(cropName: string): void {
  const icsContent = generateRecheckICS(cropName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `re-check-${(cropName || 'crop').toLowerCase().replace(/\s+/g, '-')}-sylva.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
