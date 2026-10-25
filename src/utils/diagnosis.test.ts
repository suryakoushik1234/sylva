import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_LEAVES,
  validateImageFile,
  createScanRecordFromDiagnosis,
} from './diagnosis';
import { DiagnosisRecord } from '../types';

test('SAMPLE_LEAVES contains valid crop diagnostic profiles', () => {
  assert.equal(SAMPLE_LEAVES.length >= 3, true);
  for (const sample of SAMPLE_LEAVES) {
    assert.ok(sample.cropName.length > 0);
    assert.ok(sample.conditionName.length > 0);
    assert.ok(['low', 'medium', 'high'].includes(sample.severity));
    assert.ok(sample.confidence > 50 && sample.confidence <= 100);
    assert.ok(sample.actions.length > 0);
  }
});

test('validateImageFile rejects invalid mime types and large files', () => {
  const invalidFile = {
    type: 'application/pdf',
    size: 2048,
  } as File;
  const res1 = validateImageFile(invalidFile);
  assert.equal(res1.valid, false);
  assert.match(res1.error || '', /image file/i);

  const oversizedFile = {
    type: 'image/jpeg',
    size: 20 * 1024 * 1024,
  } as File;
  const res2 = validateImageFile(oversizedFile);
  assert.equal(res2.valid, false);
  assert.match(res2.error || '', /15MB/i);

  const validFile = {
    type: 'image/jpeg',
    size: 500 * 1024,
  } as File;
  const res3 = validateImageFile(validFile);
  assert.equal(res3.valid, true);
  assert.equal(res3.error, undefined);
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
    actions: ['Remove infected leaves'],
    createdAt: new Date().toISOString(),
  };

  const record = createScanRecordFromDiagnosis(diag, 'data:image/jpeg;base64,abc');
  assert.equal(record.id, 'diag-42');
  assert.equal(record.cropName, 'Tomato');
  assert.equal(record.conditionName, 'Early Blight');
  assert.equal(record.severity, 'medium');
  assert.equal(record.confidence, 95);
  assert.equal(record.shortSummary, 'Target-like brown lesions on lower leaves.');
  assert.equal(record.imageThumbnail, 'data:image/jpeg;base64,abc');
  assert.ok(record.timestamp > 0);
});
