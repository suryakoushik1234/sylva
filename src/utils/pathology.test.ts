import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFoliarAnalysis,
  HACKATHON_DEMO_PRESETS,
  createDiagnosisFromPreset,
} from './pathology';

test('computeFoliarAnalysis generates consistent damage percentages within biological bounds', () => {
  const highAnalysis = computeFoliarAnalysis('Late Blight', 'high', 'Potato');
  assert.ok(highAnalysis.damagePercentage >= 35 && highAnalysis.damagePercentage <= 60);
  assert.equal(highAnalysis.sporulationRisk, 'high');
  assert.ok(highAnalysis.lesionClusters.length >= 7);
  assert.equal(
    Math.round((highAnalysis.damagePercentage + highAnalysis.healthyPercentage) * 10) / 10,
    100
  );

  const medAnalysis = computeFoliarAnalysis('Early Blight', 'medium', 'Tomato');
  assert.ok(medAnalysis.damagePercentage >= 20 && medAnalysis.damagePercentage <= 35);
  assert.equal(medAnalysis.sporulationRisk, 'moderate');
  assert.ok(medAnalysis.lesionClusters.length >= 5);
});

test('HACKATHON_DEMO_PRESETS contains 3 valid preset scenarios', () => {
  assert.equal(HACKATHON_DEMO_PRESETS.length, 3);
  const expectedCrops = ['Tomato', 'Potato', 'Maize / Corn'];

  for (const preset of HACKATHON_DEMO_PRESETS) {
    assert.ok(expectedCrops.includes(preset.cropName));
    assert.ok(preset.damagePct > 0 && preset.damagePct < 100);
    assert.ok(preset.todaySteps.length >= 2);
    assert.ok(preset.thisWeekSteps.length >= 2);
    assert.ok(preset.imagePath.startsWith('/samples/'));
  }
});

test('createDiagnosisFromPreset accurately hydrades diagnosis with foliar analysis', () => {
  const preset = HACKATHON_DEMO_PRESETS[0];
  const diag = createDiagnosisFromPreset(preset);

  assert.equal(diag.cropName, 'Tomato');
  assert.equal(diag.severity, 'high');
  assert.equal(diag.urgency, 'act_today');
  assert.equal(diag.foliarAnalysis?.damagePercentage, preset.damagePct);
  assert.ok((diag.foliarAnalysis?.lesionClusters.length ?? 0) >= 7);
});
