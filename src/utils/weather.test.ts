import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scanBestSprayWindow,
  HourlyForecastPoint,
  MAX_SPRAY_WIND_KMH,
  MAX_SPRAY_RAIN_PROB_PCT,
  MAX_SPRAY_TEMP_C,
  isDiurnalPreferredHour,
} from './weather';

test('spray window named rule constants are strictly defined', () => {
  assert.equal(MAX_SPRAY_WIND_KMH, 15);
  assert.equal(MAX_SPRAY_RAIN_PROB_PCT, 20);
  assert.equal(MAX_SPRAY_TEMP_C, 30);
});

test('isDiurnalPreferredHour correctly recognizes 5-9 AM and 16-19 PM', () => {
  assert.equal(isDiurnalPreferredHour(6), true);
  assert.equal(isDiurnalPreferredHour(8), true);
  assert.equal(isDiurnalPreferredHour(17), true);
  assert.equal(isDiurnalPreferredHour(18), true);
  assert.equal(isDiurnalPreferredHour(12), false); // Noon
  assert.equal(isDiurnalPreferredHour(2), false); // Middle of night
});

test('scanBestSprayWindow selects optimal calm morning window when conditions are ideal', () => {
  // Construct 48 hours of mock data with an optimal window at hour 6-8 (6:00-9:00 AM)
  const hourly: HourlyForecastPoint[] = [];
  const baseTime = new Date('2026-10-27T00:00:00Z');

  for (let i = 0; i < 48; i++) {
    const d = new Date(baseTime.getTime() + i * 3600 * 1000);
    const hour = d.getUTCHours();

    // Default windy or midday heat
    let tempC = 28;
    let windKmh = 18; // windy
    let rainProb = 5;

    // Make hour 6, 7, 8 calm and optimal
    if (hour >= 6 && hour <= 8) {
      tempC = 22;
      windKmh = 8;
      rainProb = 0;
    }

    hourly.push({
      time: d.toISOString(),
      hour,
      dateStr: d.toISOString().split('T')[0],
      tempC,
      rainProb,
      windKmh,
    });
  }

  const result = scanBestSprayWindow(hourly, 'Early Blight');
  assert.equal(result.status, 'optimal');
  assert.match(result.title, /Best window to treat Early Blight/);
  assert.equal(result.isFallbackLeastBad, false);
  assert.equal(result.hourlyTimeline.length, 24);
});

test('scanBestSprayWindow falls back to least-bad option when rain or wind is high', () => {
  // Construct 48 hours where wind is always > 15 km/h
  const hourly: HourlyForecastPoint[] = [];
  const baseTime = new Date('2026-10-27T00:00:00Z');

  for (let i = 0; i < 48; i++) {
    const d = new Date(baseTime.getTime() + i * 3600 * 1000);
    hourly.push({
      time: d.toISOString(),
      hour: d.getUTCHours(),
      dateStr: d.toISOString().split('T')[0],
      tempC: 25,
      rainProb: 35, // High rain risk
      windKmh: 20, // High wind
    });
  }

  const result = scanBestSprayWindow(hourly, 'Late Blight');
  assert.equal(result.status, 'poor');
  assert.equal(result.isFallbackLeastBad, true);
  assert.ok(result.missedRuleExplanation && result.missedRuleExplanation.length > 0);
  assert.match(result.plainVerdict, /Not recommended to spray today/);
});

test('scanBestSprayWindow never proposes past hours when reference time is in afternoon', () => {
  const hourly: HourlyForecastPoint[] = [];
  // Base day starts at 00:00
  const baseTime = new Date('2026-10-27T00:00:00Z');

  for (let i = 0; i < 48; i++) {
    const d = new Date(baseTime.getTime() + i * 3600 * 1000);
    const hour = d.getUTCHours();
    // Suppose 6-8 AM was optimal earlier today
    const wasCalmMorning = i === 6 || i === 7 || i === 8;
    // And 17-19 PM (5-7 PM) is also calm this evening
    const isCalmEvening = i === 17 || i === 18 || i === 19;

    hourly.push({
      time: d.toISOString(),
      hour,
      dateStr: d.toISOString().split('T')[0],
      tempC: wasCalmMorning || isCalmEvening ? 22 : 32,
      rainProb: 5,
      windKmh: wasCalmMorning || isCalmEvening ? 8 : 18,
    });
  }

  // Current time is 14:00 (2 PM)
  const simulatedNow = new Date('2026-10-27T14:00:00Z');
  const result = scanBestSprayWindow(hourly, 'Blight', 'Pune', simulatedNow);

  // The proposed window must NOT be 6:00 AM Today (which already passed)
  const windowStartEpoch = new Date(result.hourlyTimeline[0].time).getTime();
  assert.ok(windowStartEpoch >= new Date('2026-10-27T14:00:00Z').getTime());
  assert.match(result.bestWindowTime, /(5:00|17:00|Tomorrow)/i);
});
