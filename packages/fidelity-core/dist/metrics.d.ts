import type { GapMetrics, GapVerdict } from './types.js';
export declare function classifyVerdict(metrics: GapMetrics): GapVerdict;
export declare function interpretVerdict(verdict: GapVerdict): string;
export declare function computeStats(results: Array<{
    transferGap: number;
    convergenceScore: number;
}>): {
    meanTransferGap: number;
    meanConvergence: number;
    stdDevTransferGap: number;
    ci95Lower: number;
    ci95Upper: number;
    taskCount: number;
};
export declare function normalizeGap(realGap: number, negativeControlGap: number, positiveControlGap: number): number;
export declare function classifyCalibrationQuality(negativeGap: number, positiveGap: number): 'good' | 'poor' | 'inverted';
export declare function classifyTransferLevel(score: number): string;
//# sourceMappingURL=metrics.d.ts.map