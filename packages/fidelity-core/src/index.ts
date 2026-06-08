export type {
  TaskType,
  GeneratedTask,
  TransferLevel,
  PerAxiomTransfer,
  FidelityVerdict,
  PerTaskResult,
  TaskStats,
  CalibrationQuality,
  CalibrationAnchors,
  ProfileQuality,
  BlindEvalMeta,
  FidelityDimension,
  ComparisonCondition,
  ComparisonResult,
  FidelityWarningType,
  FidelityWarning,
  FidelityResult,
  GapVerdict,
  GapMetrics,
} from './types.js';

export { GAP_THRESHOLDS } from './types.js';

export {
  classifyVerdict,
  interpretVerdict,
  computeStats,
  normalizeGap,
  classifyCalibrationQuality,
  classifyTransferLevel,
} from './metrics.js';
