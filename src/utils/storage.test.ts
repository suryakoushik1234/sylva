import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoredHasEnteredApp,
  setStoredHasEnteredApp,
  loadStoredScans,
  saveStoredScans,
  getTabOrderIndex,
  calculateTabDirection,
  getSeverityStyle,
} from './storage';
import { ScanHistoryItem } from '../types';

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

test('hasEnteredApp storage reads and writes correctly', () => {
  const mock = new MockStorage();
  assert.equal(getStoredHasEnteredApp(mock), false);
  setStoredHasEnteredApp(true, mock);
  assert.equal(getStoredHasEnteredApp(mock), true);
  setStoredHasEnteredApp(false, mock);
  assert.equal(getStoredHasEnteredApp(mock), false);
});

test('scans history serialization and retrieval works', () => {
  const mock = new MockStorage();
  // When empty, loadStoredScans initializes with default Indian scans for immediate realism
  assert.ok(loadStoredScans(mock).length > 0);

  const sampleScan: ScanHistoryItem = {
    id: 'scan-1',
    timestamp: 1729860000000,
    cropName: 'Tomato',
    conditionName: 'Early Blight',
    severity: 'medium',
    confidence: 94,
    shortSummary: 'Dark spots with concentric rings on lower leaves',
  };

  saveStoredScans([sampleScan], mock);
  const loaded = loadStoredScans(mock);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].cropName, 'Tomato');
  assert.equal(loaded[0].severity, 'medium');
});

test('tab direction calculates correct slide direction', () => {
  assert.equal(getTabOrderIndex('scan'), 0);
  assert.equal(getTabOrderIndex('weather'), 1);
  assert.equal(getTabOrderIndex('field-log'), 2);

  // Moving forward
  assert.equal(calculateTabDirection('scan', 'weather'), 1);
  assert.equal(calculateTabDirection('scan', 'field-log'), 1);

  // Moving backward
  assert.equal(calculateTabDirection('field-log', 'weather'), -1);
  assert.equal(calculateTabDirection('weather', 'scan'), -1);

  // Same tab
  assert.equal(calculateTabDirection('weather', 'weather'), 0);
});

test('severity style returns accurate theme-approved tones', () => {
  const high = getSeverityStyle('high');
  assert.equal(high.color, '#A8423F');

  const medium = getSeverityStyle('medium');
  assert.equal(medium.color, '#C0772C');

  const low = getSeverityStyle('low');
  assert.equal(low.color, '#34796E');
});
