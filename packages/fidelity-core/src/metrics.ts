import type { GapMetrics, GapVerdict } from './types.js';
import { GAP_THRESHOLDS } from './types.js';

export function classifyVerdict(metrics: GapMetrics): GapVerdict {
  if (metrics.naiveDrift < 0.1 && metrics.transferGap < 0.1) {
    return 'common_sense';
  }
  if (metrics.gapWidth < 0.05) {
    return 'inconclusive';
  }
  if (metrics.transferGap >= GAP_THRESHOLDS.strong) {
    return 'strong_transfer';
  }
  if (metrics.transferGap >= GAP_THRESHOLDS.partial) {
    return 'partial_transfer';
  }
  if (metrics.transferGap >= GAP_THRESHOLDS.weak) {
    return 'weak_transfer';
  }
  return 'no_transfer';
}

export function interpretVerdict(verdict: GapVerdict): string {
  switch (verdict) {
    case 'strong_transfer':
      return 'High confidence that KDNA judgment transferred to the trained output';
    case 'partial_transfer':
      return 'Moderate evidence of KDNA judgment transfer, with some dilution';
    case 'weak_transfer':
      return 'Limited evidence of KDNA judgment transfer';
    case 'no_transfer':
      return 'No measurable evidence that KDNA judgment reached the output';
    case 'common_sense':
      return 'Output aligns with KDNA but is equally explainable by general knowledge — KDNA may not be the differentiating factor';
    case 'inconclusive':
      return 'Outputs too similar to distinguish — insufficient signal for measurement';
  }
}

export function computeStats(
  results: Array<{ transferGap: number; convergenceScore: number }>,
): { meanTransferGap: number; meanConvergence: number; stdDevTransferGap: number; ci95Lower: number; ci95Upper: number; taskCount: number } {
  const n = results.length;
  if (n === 0) {
    return { meanTransferGap: 0, meanConvergence: 0, stdDevTransferGap: 0, ci95Lower: 0, ci95Upper: 0, taskCount: 0 };
  }

  const meanGap = results.reduce((s, r) => s + r.transferGap, 0) / n;
  const meanConv = results.reduce((s, r) => s + r.convergenceScore, 0) / n;

  const variance = n > 1
    ? results.reduce((s, r) => s + Math.pow(r.transferGap - meanGap, 2), 0) / (n - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const se = stdDev / Math.sqrt(n);
  const ci95Lower = meanGap - 1.96 * se;
  const ci95Upper = meanGap + 1.96 * se;

  return { meanTransferGap: meanGap, meanConvergence: meanConv, stdDevTransferGap: stdDev, ci95Lower, ci95Upper, taskCount: n };
}

export function normalizeGap(realGap: number, negativeControlGap: number, positiveControlGap: number): number {
  const denominator = positiveControlGap - negativeControlGap;
  if (denominator <= 0) return 0;
  const normalized = (realGap - negativeControlGap) / denominator;
  return Math.max(0, Math.min(1, normalized));
}

export function classifyCalibrationQuality(negativeGap: number, positiveGap: number): 'good' | 'poor' | 'inverted' {
  if (negativeGap >= positiveGap) return 'inverted';
  if (positiveGap - negativeGap < 0.1) return 'poor';
  return 'good';
}

export function classifyTransferLevel(score: number): string {
  if (score >= 0.80) return 'operationalized';
  if (score >= 0.60) return 'referenced';
  if (score >= 0.30) return 'mentioned';
  if (score >= 0.01) return 'absent';
  return 'contradicted';
}
