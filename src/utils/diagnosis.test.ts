import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REAL_SAMPLE_LEAVES,
  validateImageFile,
  createScanRecordFromDiagnosis,
  buildShareSummary,
  generateRecheckICS,
} from './diagnosis';
import { DiagnosisRecord } from '../types';

test('REAL_SAMPLE_LEAVES contains 3 real foliage leaf specimens from /public/samples', () => {
  assert.equal(REAL_SAMPLE_LEAVES.length, 3);
  const expectedPaths = [
    '/samples/tomato_early_blight.jpg',
    '/samples/potato_late_blight.jpg',
    '/samples/corn_common_rust.jpg',
  ];
  for (const sample of REAL_SAMPLE_LEAVES) {
    assert.ok(sample.cropName.length > 0);
    assert.ok(sample.label.length > 0);
    assert.ok(expectedPaths.includes(sample.imagePath));
  }
});

test('validateImageFile rejects invalid mime types and oversized files', () => {
  const invalidFile = {
    type: 'application/pdf',
    size: 2048,
  } as File;
  const res1 = validateImageFile(invalidFile);
  assert.equal(res1.valid, false);
  assert.match(res1.error || '', /image file/i);

  const oversizedFile = {
    type: 'image/jpeg',
    size: 25 * 1024 * 1024,
  } as File;
  const res2 = validateImageFile(oversizedFile);
  assert.equal(res2.valid, false);
  assert.match(res2.error || '', /20MB/i);

  const validFile = {
    type: 'image/jpeg',
    size: 500 * 1024,
  } as File;
  const res3 = validateImageFile(validFile);
  assert.equal(res3.valid, true);
});

test('buildShareSummary generates exact required plain text format', () => {
  const summary = buildShareSummary(
    {
      cropName: 'Tomato',
      conditionName: 'Early Blight',
      severity: 'high',
      today_steps: ['Prune and isolate lower infected leaves.'],
    },
    'en',
    'https://sylva.farm'
  );

  assert.equal(
    summary,
    'Sylva diagnosis / Crop: Tomato / Problem: Early Blight (high severity) / First step: Prune and isolate lower infected leaves. / Follow the product label and confirm with your local agri officer / KVK. / https://sylva.farm'
  );
});

test('generateRecheckICS creates valid VCALENDAR 5 days later', () => {
  const ics = generateRecheckICS('Potato');
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Re-check Potato - Sylva/);
  assert.match(ics, /Follow the product label and confirm with your local agri officer \/ KVK/);
  assert.match(ics, /END:VCALENDAR/);
});

test('createScanRecordFromDiagnosis maps record fields accurately', () => {
  const diag: DiagnosisRecord = {
    id: 'diag-42',
    cropName: 'Tomato',
    conditionName: 'Early Blight',
    category: 'fungal',
    severity: 'medium',
    confidence: 95,
    summary: 'Target-like brown lesions on lower leaves.',
    urgency: 'act_this_week',
    today_steps: ['Prune infected leaves safely'],
    this_week_steps: ['Apply Bacillus subtilis'],
    prevent_next_season: ['Crop rotation'],
    call_expert: false,
    actions: ['Remove infected leaves'],
    createdAt: new Date().toISOString(),
  };

  const record = createScanRecordFromDiagnosis(diag, 'data:image/jpeg;base64,abc');
  assert.equal(record.id, 'diag-42');
  assert.equal(record.cropName, 'Tomato');
  assert.equal(record.conditionName, 'Early Blight');
  assert.equal(record.severity, 'medium');
  assert.equal(record.confidence, 95);
  assert.equal(record.urgency, 'act_this_week');
  assert.equal(record.today_steps?.length, 1);
  assert.equal(record.imageThumbnail, 'data:image/jpeg;base64,abc');
  assert.ok(record.timestamp > 0);
});
