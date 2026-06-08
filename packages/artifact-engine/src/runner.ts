import type { Run, EngineDefinition, Artifact } from './types.js';
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

export class AutoApproveGate implements HumanReviewGate {
  async requestReview(_stageId: string, _artifactIds: string[]) {
    return {
      reviewId: `auto_${Date.now()}`,
      decision: 'approved' as const,
      comments: [],
    };
  }
}

export function wrapAsEnvelope(artifact: Artifact, generator: { engine: string; version: string }): ArtifactEnvelope {
  return {
    artifact_id: artifact.artifactId,
    artifact_type: artifact.type,
    schema_version: '1.0.0',
    created_at: artifact.createdAt,
    generator,
    source_kdna: [],
    content: artifact.data,
    content_digest: '',
  };
}
