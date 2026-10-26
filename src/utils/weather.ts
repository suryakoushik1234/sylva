import { EvaluatedSprayWindow, SeverityLevel, SprayWindowHour, WeatherCondition } from '../types';

/**
 * NAMED CONSTANTS FOR SPRAY WINDOW RULES
 */
export const MAX_SPRAY_WIND_KMH = 15;
export const MAX_SPRAY_RAIN_PROB_PCT = 20;
export const RAIN_FREE_AFTER_WINDOW_HOURS = 6;
export const MAX_SPRAY_TEMP_C = 30;
export const PREFERRED_HOURS_MORNING = { start: 5, end: 9 };
export const PREFERRED_HOURS_EVENING = { start: 16, end: 19 };
export const WINDOW_DURATION_HOURS = 3;

export const DEFAULT_FALLBACK_LOCATION = {
  latitude: 18.5204,
  longitude: 73.8567,
  name: 'Pune Region (Maharashtra Agri Belt)',
};

export interface GeoLocationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export const INDIAN_AGRICULTURAL_HUBS = [
  { name: 'Pune (Maharashtra)', detail: 'Sugarcane, Grapes, Pomegranate', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Nashik (Maharashtra)', detail: 'Onions, Grapes, Tomato', latitude: 19.9975, longitude: 73.7898 },
  { name: 'Nagpur / Vidarbha (Maharashtra)', detail: 'Cotton, Oranges, Soybean', latitude: 21.1458, longitude: 79.0882 },
  { name: 'Varanasi (Uttar Pradesh)', detail: 'Paddy Rice, Wheat, Veg', latitude: 25.3176, longitude: 82.9739 },
  { name: 'Ludhiana (Punjab)', detail: 'Wheat, Paddy, Cotton', latitude: 30.9010, longitude: 75.8573 },
  { name: 'Karnal (Haryana)', detail: 'Basmati Rice, Mustard, Wheat', latitude: 29.6857, longitude: 76.9905 },
  { name: 'Guntur (Andhra Pradesh)', detail: 'Chilli, Cotton, Tobacco', latitude: 16.3067, longitude: 80.4365 },
  { name: 'Warangal (Telangana)', detail: 'Cotton, Chilli, Turmeric', latitude: 17.9689, longitude: 79.5941 },
  { name: 'Indore / Malwa (Madhya Pradesh)', detail: 'Soybean, Wheat, Garlic', latitude: 22.7196, longitude: 75.8577 },
  { name: 'Rajkot (Gujarat)', detail: 'Groundnut, Cotton, Sesame', latitude: 22.3039, longitude: 70.8022 },
  { name: 'Coimbatore (Tamil Nadu)', detail: 'Coconut, Cotton, Tea', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Mysuru / Mandya (Karnataka)', detail: 'Paddy, Sugarcane, Ragi', latitude: 12.2958, longitude: 76.6394 },
  { name: 'Patna (Bihar)', detail: 'Maize, Rice, Pulses', latitude: 25.5941, longitude: 85.1376 },
  { name: 'Jaipur / Alwar (Rajasthan)', detail: 'Mustard, Bajra, Guar', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Shimla (Himachal Pradesh)', detail: 'Apple, Pear, Stone Fruit', latitude: 31.1048, longitude: 77.1734 },
  { name: 'New Delhi (NCR)', detail: 'Wheat, Mustard, Horticulture', latitude: 28.6139, longitude: 77.2090 },
];

export async function searchLocations(query: string): Promise<GeoLocationResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Geocoding search error:', err);
    return [];
  }
}

export interface HourlyForecastPoint {
  time: string;
  hour: number;
  dateStr: string;
  tempC: number;
  rainProb: number;
  windKmh: number;
}

/**
 * Fetch 48-hour hourly forecast from Open-Meteo
 */
export async function fetchHourlyForecast(
  lat: number = DEFAULT_FALLBACK_LOCATION.latitude,
  lon: number = DEFAULT_FALLBACK_LOCATION.longitude
): Promise<{ hourly: HourlyForecastPoint[]; current: WeatherCondition }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code&forecast_days=3&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service returned ${res.status}`);
  }

  const data = await res.json();
  const times: string[] = data.hourly?.time || [];
  const temps: number[] = data.hourly?.temperature_2m || [];
  const rainProbs: number[] = data.hourly?.precipitation_probability || [];
  const winds: number[] = data.hourly?.wind_speed_10m || [];

  const hourly: HourlyForecastPoint[] = times.map((t, i) => {
    const d = new Date(t);
    return {
      time: t,
      hour: d.getHours(),
      dateStr: t.split('T')[0],
      tempC: temps[i] ?? 24,
      rainProb: rainProbs[i] ?? 0,
      windKmh: winds[i] ?? 8,
    };
  });

  const currentTemp = data.current?.temperature_2m ?? hourly[0]?.tempC ?? 26;
  const currentHumidity = data.current?.relative_humidity_2m ?? 74;
  const currentWind = data.current?.wind_speed_10m ?? hourly[0]?.windKmh ?? 10;

  const current: WeatherCondition = {
    temperatureC: currentTemp,
    humidityPct: currentHumidity,
    windSpeedKmh: currentWind,
    condition: currentHumidity > 80 ? 'Humid & Overcast' : 'Partly Cloudy',
    rainRisk: currentHumidity > 80 ? 'medium' : 'low',
    fungalRisk: currentHumidity > 75 ? 'high' : 'medium',
    sprayAdvisory: currentWind > MAX_SPRAY_WIND_KMH ? 'Windy drift caution' : 'Moderate spray conditions',
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  return { hourly, current };
}

/**
 * Evaluates whether a specific hour is preferred diurnal time (5-9 AM or 16-19 PM)
 */
export function isDiurnalPreferredHour(hour: number): boolean {
  return (
    (hour >= PREFERRED_HOURS_MORNING.start && hour <= PREFERRED_HOURS_MORNING.end) ||
    (hour >= PREFERRED_HOURS_EVENING.start && hour <= PREFERRED_HOURS_EVENING.end)
  );
}

/**
 * Evaluates hourly spray suitability score & status
 */
export function evaluateHourQuality(
  point: HourlyForecastPoint,
  allPoints: HourlyForecastPoint[],
  pointIndex: number
): { quality: 'optimal' | 'moderate' | 'poor'; reason: string } {
  // Check rain in this hour
  if (point.rainProb >= MAX_SPRAY_RAIN_PROB_PCT) {
    return {
      quality: 'poor',
      reason: `Rain risk elevated (${point.rainProb}% prob). Chemical wash-off expected.`,
    };
  }

  // Check 6-hour rain buffer after this hour
  const afterBuffer = allPoints.slice(pointIndex, pointIndex + RAIN_FREE_AFTER_WINDOW_HOURS + 1);
  const maxRainAfter = Math.max(...afterBuffer.map((p) => p.rainProb), 0);
  if (maxRainAfter >= MAX_SPRAY_RAIN_PROB_PCT) {
    return {
      quality: 'poor',
      reason: `Rain forecast within 6h window (${maxRainAfter}% prob). Needs drying adherence.`,
    };
  }

  // Check wind
  if (point.windKmh >= MAX_SPRAY_WIND_KMH) {
    return {
      quality: 'poor',
      reason: `High wind (${point.windKmh} km/h > ${MAX_SPRAY_WIND_KMH} km/h). Spray drift hazard.`,
    };
  }

  // Check temperature
  if (point.tempC >= MAX_SPRAY_TEMP_C) {
    return {
      quality: 'moderate',
      reason: `Temperature elevated (${point.tempC}°C). High droplet evaporation risk.`,
    };
  }

  // Check preferred hour
  if (!isDiurnalPreferredHour(point.hour)) {
    return {
      quality: 'moderate',
      reason: `Acceptable weather, but outside prime canopy absorption windows (5-9 AM, 4-7 PM).`,
    };
  }

  return {
    quality: 'optimal',
    reason: `Ideal calm conditions (${point.windKmh} km/h wind, ${point.tempC}°C, rain-free 6h+).`,
  };
}

/**
 * 48-Hour Scanner for best 3-hour window
 */
export function scanBestSprayWindow(
  hourly: HourlyForecastPoint[],
  problemName?: string,
  locationName: string = DEFAULT_FALLBACK_LOCATION.name
): EvaluatedSprayWindow {
  const pointsToScan = hourly.slice(0, 48);

  interface WindowCandidate {
    startIndex: number;
    points: HourlyForecastPoint[];
    avgTemp: number;
    maxWind: number;
    maxRainWindow: number;
    maxRainBuffer: number;
    allDiurnal: boolean;
    violatesRain: boolean;
    violatesRainBuffer: boolean;
    violatesWind: boolean;
    violatesTemp: boolean;
    score: number;
  }

  const candidates: WindowCandidate[] = [];

  for (let i = 0; i <= pointsToScan.length - WINDOW_DURATION_HOURS; i++) {
    const windowPoints = pointsToScan.slice(i, i + WINDOW_DURATION_HOURS);
    const bufferPoints = pointsToScan.slice(i, i + WINDOW_DURATION_HOURS + RAIN_FREE_AFTER_WINDOW_HOURS);

    const avgTemp = windowPoints.reduce((acc, p) => acc + p.tempC, 0) / WINDOW_DURATION_HOURS;
    const maxWind = Math.max(...windowPoints.map((p) => p.windKmh));
    const maxRainWindow = Math.max(...windowPoints.map((p) => p.rainProb));
    const maxRainBuffer = Math.max(...bufferPoints.map((p) => p.rainProb), 0);
    const allDiurnal = windowPoints.every((p) => isDiurnalPreferredHour(p.hour));

    const violatesRain = maxRainWindow >= MAX_SPRAY_RAIN_PROB_PCT;
    const violatesRainBuffer = maxRainBuffer >= MAX_SPRAY_RAIN_PROB_PCT;
    const violatesWind = maxWind >= MAX_SPRAY_WIND_KMH;
    const violatesTemp = avgTemp >= MAX_SPRAY_TEMP_C;

    // Scoring system: Higher is better
    let score = 100;
    if (violatesRain) score -= 60;
    if (violatesRainBuffer) score -= 40;
    if (violatesWind) score -= 40;
    if (violatesTemp) score -= 25;
    if (allDiurnal) score += 20;

    // Favor earlier windows slightly if equal
    score -= i * 0.2;

    candidates.push({
      startIndex: i,
      points: windowPoints,
      avgTemp,
      maxWind,
      maxRainWindow,
      maxRainBuffer,
      allDiurnal,
      violatesRain,
      violatesRainBuffer,
      violatesWind,
      violatesTemp,
      score,
    });
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] || {
    startIndex: 0,
    points: pointsToScan.slice(0, 3),
    avgTemp: 26,
    maxWind: 10,
    maxRainWindow: 5,
    maxRainBuffer: 10,
    allDiurnal: true,
    violatesRain: false,
    violatesRainBuffer: false,
    violatesWind: false,
    violatesTemp: false,
    score: 80,
  };

  const isOptimal =
    !best.violatesRain &&
    !best.violatesRainBuffer &&
    !best.violatesWind &&
    !best.violatesTemp &&
    best.allDiurnal;

  const isModerate =
    !best.violatesRain && !best.violatesRainBuffer && !best.violatesWind;

  const isFallbackLeastBad = !isOptimal;

  // Format window title and reason
  const startDate = new Date(best.points[0].time);
  const endDate = new Date(best.points[WINDOW_DURATION_HOURS - 1].time);
  // Add 1 hour to end time for display (e.g. 6 to 9 means 6:00 to 9:00)
  endDate.setHours(endDate.getHours() + 1);

  const todayStr = new Date().toDateString();
  const candidateDateStr = startDate.toDateString();
  const dayPrefix =
    candidateDateStr === todayStr
      ? 'Today'
      : candidateDateStr === new Date(Date.now() + 86400000).toDateString()
      ? 'Tomorrow'
      : startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const formatHour = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const windowTimeFormatted = `${dayPrefix}, ${formatHour(startDate)} – ${formatHour(endDate)}`;

  let reason = '';
  let missedRuleExplanation = '';

  if (isOptimal) {
    reason = `Wind < ${Math.round(best.maxWind)} km/h, rain probability < ${Math.round(best.maxRainBuffer)}% for 6h+, temp ${Math.round(best.avgTemp)}°C during calm daylight.`;
  } else if (isModerate) {
    reason = `Acceptable spray window (${Math.round(best.maxWind)} km/h wind, rain-free), but timing falls outside peak absorption hours.`;
    missedRuleExplanation = 'Outside prime morning/evening dew absorption window.';
  } else {
    reason = `Least-bad option across 48h. Rain/wind conditions are sub-optimal; evaluate foliar systemic protector cautiously.`;
    const missedRules: string[] = [];
    if (best.violatesWind) missedRules.push(`Wind exceeds ${MAX_SPRAY_WIND_KMH} km/h (${Math.round(best.maxWind)} km/h)`);
    if (best.violatesRain) missedRules.push(`Rain probability >= ${MAX_SPRAY_RAIN_PROB_PCT}% (${Math.round(best.maxRainWindow)}%)`);
    if (best.violatesRainBuffer) missedRules.push(`Rain within 6h post-spray (${Math.round(best.maxRainBuffer)}%)`);
    if (best.violatesTemp) missedRules.push(`Temperature exceeds ${MAX_SPRAY_TEMP_C}°C (${Math.round(best.avgTemp)}°C)`);
    missedRuleExplanation = missedRules.join('; ');
  }

  // Construct 24-hour timeline bar
  const timeline24 = pointsToScan.slice(0, 24).map((p, idx) => {
    const { quality, reason: ptReason } = evaluateHourQuality(p, pointsToScan, idx);
    const inBestWindow =
      idx >= best.startIndex && idx < best.startIndex + WINDOW_DURATION_HOURS;
    const hourD = new Date(p.time);
    return {
      time: p.time,
      hourLabel: hourD.toLocaleTimeString([], { hour: 'numeric' }),
      tempC: Math.round(p.tempC),
      rainProb: Math.round(p.rainProb),
      windKmh: Math.round(p.windKmh),
      quality,
      reason: ptReason,
      inBestWindow,
    };
  });

  const cardTitle = problemName
    ? `Best window to treat ${problemName}`
    : 'Best spray window';

  const currentPoint = pointsToScan[0] || { tempC: 26, windKmh: 9, rainProb: 10 };
  const currentRainRisk: SeverityLevel =
    currentPoint.rainProb > 40 ? 'high' : currentPoint.rainProb > 20 ? 'medium' : 'low';

  return {
    title: cardTitle,
    subtitle: isOptimal
      ? 'Optimal conditions confirmed (low drift & zero wash-off)'
      : 'Calibrated from 48-hour continuous microclimate forecast',
    status: isOptimal ? 'optimal' : isModerate ? 'moderate' : 'poor',
    bestWindowTime: windowTimeFormatted,
    bestWindowReason: reason,
    isFallbackLeastBad,
    missedRuleExplanation,
    hourlyTimeline: timeline24,
    currentTemp: Math.round(currentPoint.tempC),
    currentWind: Math.round(currentPoint.windKmh),
    currentRainRisk,
    locationName,
  };
}
