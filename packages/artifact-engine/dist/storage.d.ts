import type { Run, Stage, Artifact, Review } from './types.js';
export interface StorageAdapter {
    createRun(run: Run): Promise<void>;
    updateRun(run: Run): Promise<void>;
    getRun(runId: string): Promise<Run | null>;
    createStage(stage: Stage): Promise<void>;
    updateStage(stage: Stage): Promise<void>;
    getStage(stageId: string): Promise<Stage | null>;
    getStagesByRunId(runId: string): Promise<Stage[]>;
    saveArtifact(artifact: Artifact): Promise<void>;
    getArtifact(artifactId: string): Promise<Artifact | null>;
    getArtifactsByRunId(runId: string): Promise<Artifact[]>;
    saveReview(review: Review): Promise<void>;
    getReviewsByStageId(stageId: string): Promise<Review[]>;
}
//# sourceMappingURL=storage.d.ts.map