import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyVerdict,
  interpretVerdict,
  computeStats,
  normalizeGap,
  classifyCalibrationQuality,
  classifyTransferLevel,
  GAP_THRESHOLDS,
} from '../src/index.js';

test('classifyVerdict returns common_sense when naive and transfer gap are low', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.05,
    naiveDrift: 0.05,
    gapWidth: 0.2,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'common_sense');
});

test('classifyVerdict returns strong_transfer for gap >= 0.5', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.5,
    naiveDrift: 0.3,
    gapWidth: 0.6,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'strong_transfer');
});

test('classifyVerdict returns partial_transfer for gap >= 0.25', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.3,
    naiveDrift: 0.2,
    gapWidth: 0.35,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'partial_transfer');
});

test('classifyVerdict returns weak_transfer for gap >= 0.1', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.15,
    naiveDrift: 0.2,
    gapWidth: 0.25,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'weak_transfer');
});

test('classifyVerdict returns no_transfer for gap < 0.1', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.05,
    naiveDrift: 0.3,
    gapWidth: 0.2,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'no_transfer');
});

test('classifyVerdict returns inconclusive for very narrow gap', () => {
  assert.equal(classifyVerdict({
    transferGap: 0.5,
    naiveDrift: 0.3,
    gapWidth: 0.04,
    oldNewDivergence: '',
    naiveSimilarity: '',
  }), 'inconclusive');
});

test('interpretVerdict returns descriptions for all verdicts', () => {
  const verdicts = ['strong_transfer', 'partial_transfer', 'weak_transfer', 'no_transfer', 'common_sense', 'inconclusive'] as const;
  for (const v of verdicts) {
    assert.ok(interpretVerdict(v).length > 0, `interpretVerdict(${v}) should return non-empty string`);
  }
});

test('computeStats calculates correct mean and stdDev', () => {
  const stats = computeStats([
    { transferGap: 0.5, convergenceScore: 0.3 },
    { transferGap: 0.7, convergenceScore: 0.5 },
    { transferGap: 0.6, convergenceScore: 0.4 },
  ]);
  assert.ok(Math.abs(stats.meanTransferGap - 0.6) < 0.01);
  assert.ok(Math.abs(stats.meanConvergence - 0.4) < 0.01);
  assert.ok(stats.stdDevTransferGap > 0);
  assert.equal(stats.taskCount, 3);
});

test('computeStats handles single result', () => {
  const stats = computeStats([{ transferGap: 0.5, convergenceScore: 0.8 }]);
  assert.equal(stats.meanTransferGap, 0.5);
  assert.equal(stats.stdDevTransferGap, 0);
  assert.equal(stats.ci95Lower, 0.5);
  assert.equal(stats.ci95Upper, 0.5);
});

test('computeStats handles empty results', () => {
  const stats = computeStats([]);
  assert.equal(stats.taskCount, 0);
  assert.equal(stats.meanTransferGap, 0);
});

test('normalizeGap corrects for calibration', () => {
  const normalized = normalizeGap(0.4, 0.1, 0.7);
  assert.ok(Math.abs(normalized - 0.5) < 1e-10);
});

test('normalizeGap clamps to 0-1', () => {
  assert.equal(normalizeGap(1.0, 0.1, 0.5), 1.0);
  assert.equal(normalizeGap(0.0, 0.5, 0.3), 0.0);
});

test('normalizeGap handles zero denominator', () => {
  assert.equal(normalizeGap(0.4, 0.5, 0.5), 0);
});

test('classifyCalibrationQuality detects inverted controls', () => {
  assert.equal(classifyCalibrationQuality(0.5, 0.3), 'inverted');
});

test('classifyCalibrationQuality detects poor separation', () => {
  assert.equal(classifyCalibrationQuality(0.3, 0.35), 'poor');
});

test('classifyCalibrationQuality detects good separation', () => {
  assert.equal(classifyCalibrationQuality(0.1, 0.7), 'good');
});

test('classifyTransferLevel maps scores to levels', () => {
  assert.equal(classifyTransferLevel(0.90), 'operationalized');
  assert.equal(classifyTransferLevel(0.70), 'referenced');
  assert.equal(classifyTransferLevel(0.50), 'mentioned');
  assert.equal(classifyTransferLevel(0.10), 'absent');
  assert.equal(classifyTransferLevel(0.00), 'contradicted');
});

test('GAP_THRESHOLDS have expected values', () => {
  assert.equal(GAP_THRESHOLDS.strong, 0.5);
  assert.equal(GAP_THRESHOLDS.partial, 0.25);
  assert.equal(GAP_THRESHOLDS.weak, 0.1);
});
