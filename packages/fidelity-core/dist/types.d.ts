export type TaskType = 'diagnostic' | 'generative' | 'evaluative' | 'boundary';
export interface GeneratedTask {
    taskId: string;
    taskType: TaskType;
    taskPrompt: string;
    domainAxiomRef: string;
}
export type TransferLevel = 'operationalized' | 'referenced' | 'mentioned' | 'absent' | 'contradicted';
export interface PerAxiomTransfer {
    axiomId: string;
    domain: string;
    score: number;
    transferLevel: TransferLevel;
    evidence: string;
}
export type FidelityVerdict = 'preserved' | 'partially_preserved' | 'diluted' | 'contradicted';
export interface PerTaskResult {
    taskId: string;
    taskType: TaskType;
    taskPrompt: string;
    convergenceScore: number;
    transferGap: number;
    naiveDrift: number;
    fidelityVerdict: FidelityVerdict;
    dilutionSignals: string[];
    preservedSignals: string[];
}
export interface TaskStats {
    taskResults: PerTaskResult[];
    meanConvergence: number;
    meanTransferGap: number;
    stdDevTransferGap: number;
    ci95Lower: number;
    ci95Upper: number;
    taskCount: number;
}
export type CalibrationQuality = 'good' | 'poor' | 'inverted';
export interface CalibrationAnchors {
    negativeControlGap: number;
    positiveControlGap: number;
    normalizedGap: number;
    calibrationQuality: CalibrationQuality;
}
export interface ProfileQuality {
    profilesAreOpposing: boolean;
    evidence: string;
    confidence: number;
}
export interface BlindEvalMeta {
    shuffleMap: Record<string, 'old_judgment' | 'new_judgment' | 'naive'>;
    identityInferenceCorrect: boolean;
    inferredOldLearner: string;
    actualOldLearner: string;
    inferenceConfidence: number;
    inferenceReasoning: string;
}
export interface FidelityDimension {
    dimensionId: string;
    dimensionName: string;
    score: number;
    weight: number;
    evidence: Array<{
        claim: string;
        verdict: 'confirmed' | 'partial' | 'absent' | 'contradicted';
        detail: string;
    }>;
    threshold?: number;
}
export interface ComparisonCondition {
    conditionId: string;
    conditionType: 'no_kdna' | 'best_prompt' | 'kdna_loaded' | 'kdna_cluster' | 'calibration_positive' | 'calibration_negative';
    model: string;
    modelConfig?: {
        temperature?: number;
        top_p?: number;
    };
    score: number;
    judgmentDelta?: number;
}
export interface ComparisonResult {
    conditions: ComparisonCondition[];
    blindDelta: number;
    blindDesign: 'a_b_shuffled' | 'a_b_c_shuffled' | 'pairwise' | 'ranking';
    evaluatorModel: string;
    evaluatorRubric: string;
}
export type FidelityWarningType = 'calibration_failed' | 'high_variance' | 'low_task_count' | 'evaluator_bias_risk' | 'model_same_as_generator' | 'trace_incomplete';
export interface FidelityWarning {
    type: FidelityWarningType;
    message: string;
}
export interface FidelityResult {
    fidelityId: string;
    protocolVersion: string;
    targetArtifact: {
        artifactId: string;
        artifactType: string;
        contentDigest?: string;
        generator?: {
            engine: string;
            version: string;
        };
    };
    sourceKdna: Array<{
        name: string;
        version: string;
        role: string;
    }>;
    overallScore: number;
    passThreshold: number;
    passed: boolean;
    dimensions: FidelityDimension[];
    perAxiom?: PerAxiomTransfer[];
    comparison?: ComparisonResult;
    calibration?: CalibrationAnchors & {
        calibrationValid: boolean;
    };
    crossModel?: Array<{
        model: string;
        score: number;
    }>;
    crossModelVariance?: number;
    tasks: Array<{
        taskId: string;
        taskType: TaskType;
        inputSummary: string;
        expectedAxioms?: string[];
        expectedMisunderstandingsAvoided?: string[];
        taskScore: number;
    }>;
    traceRefs?: Array<{
        traceId: string;
        traceType?: string;
    }>;
    warnings?: FidelityWarning[];
    completedAt: string;
    measurementDurationMs?: number;
    evaluator?: {
        engine: string;
        version: string;
    };
}
export declare const GAP_THRESHOLDS: {
    readonly strong: 0.5;
    readonly partial: 0.25;
    readonly weak: 0.1;
};
export type GapVerdict = 'strong_transfer' | 'partial_transfer' | 'weak_transfer' | 'no_transfer' | 'common_sense' | 'inconclusive';
export interface GapMetrics {
    transferGap: number;
    naiveDrift: number;
    gapWidth: number;
    oldNewDivergence: string;
    naiveSimilarity: string;
}
//# sourceMappingURL=types.d.ts.map