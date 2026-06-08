import type { Artifact } from './types.js';
import type { StorageAdapter } from './storage.js';
import type { ArtifactEnvelope } from './artifact.js';
export interface StageContext {
    runId: string;
    engineId: string;
    engineVersion: string;
    domainPath: string;
    previousArtifacts: Artifact[];
    runtimeContext: Record<string, unknown>;
    storage: StorageAdapter;
}
export interface StageResult {
    artifacts: Artifact[];
    status: 'completed' | 'failed' | 'awaiting_human_review';
    errorMessage?: string;
    runtimeContext?: Record<string, unknown>;
}
export interface StageDefinition {
    stageId: string;
    name: string;
    description: string;
    requiresHumanReview: boolean;
    parallelGroup?: string;
    execute: (context: StageContext) => Promise<StageResult>;
}
export interface HumanReviewGate {
    requestReview(stageId: string, artifactIds: string[]): Promise<{
        reviewId: string;
        decision: 'approved' | 'approved_with_changes' | 'rejected' | 'pending';
        comments: string[];
    }>;
}
export declare class AutoApproveGate implements HumanReviewGate {
    requestReview(_stageId: string, _artifactIds: string[]): Promise<{
        reviewId: string;
        decision: "approved";
        comments: never[];
    }>;
}
export declare function wrapAsEnvelope(artifact: Artifact, generator: {
    engine: string;
    version: string;
}): ArtifactEnvelope;
//# sourceMappingURL=runner.d.ts.map