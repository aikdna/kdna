import type { Artifact, ArtifactStatus } from './artifact.js';
export type { Artifact, ArtifactStatus };

export type RunStatus = 'pending' | 'running' | 'awaiting_human_review' | 'completed' | 'failed' | 'paused';

export interface Run {
  runId: string;
  engineId: string;
  domainPath: string;
  domainId?: string;
  domainHash?: string;
  status: RunStatus;
  currentStageId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export type StageStatus = 'pending' | 'running' | 'awaiting_human_review' | 'completed' | 'failed' | 'skipped';

export interface Stage {
  stageId: string;
  runId: string;
  engineId: string;
  name: string;
  description: string;
  status: StageStatus;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  requiresHumanReview: boolean;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export type ReviewDecision = 'approved' | 'approved_with_changes' | 'rejected' | 'pending';

export interface Review {
  reviewId: string;
  runId: string;
  stageId: string;
  artifactId: string;
  reviewerId?: string;
  decision: ReviewDecision;
  comments: string[];
  createdAt: string;
}

export interface Revision {
  revisionId: string;
  artifactId: string;
  previousArtifactId: string;
  runId: string;
  stageId: string;
  changes: string[];
  changeReason: string;
  createdAt: string;
}

export interface EngineDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  supportedArtifacts: string[];
  requiredKdnaCapabilities: string[];
  stages: string[];
}
