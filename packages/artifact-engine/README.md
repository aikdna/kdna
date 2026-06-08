# @kdna/artifact-engine

Reference SDK for multi-stage KDNA-governed artifact generation pipelines.

## Naming Convention

This SDK uses **camelCase** for TypeScript/JavaScript identifiers, consistent
with the JavaScript ecosystem. KDNA protocol schemas and RFC documents use
**snake_case** for JSON field names, consistent with the KDNA JSON Schema
conventions.

Mapping table for key fields:

| TypeScript (camelCase) | JSON / RFC-0009 (snake_case) |
|------------------------|------------------------------|
| `artifactId` | `artifact_id` |
| `artifactType` | `artifact_type` |
| `runId` | `run_id` |
| `stageId` | `stage_id` |
| `engineId` | `engine_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `contentDigest` | `content_digest` |
| `schemaVersion` | `schema_version` |
| `traceId` | `trace_id` |
| `sourceKdna` | `source_kdna` |

The `ArtifactEnvelopeSchema` (Zod) handles serialization to snake_case
automatically when `.parse()` is called on input data.

## Usage

```typescript
import { ArtifactSchema, StageDefinition, StorageAdapter, AutoApproveGate } from '@kdna/artifact-engine';

// Define a stage
const myStage: StageDefinition = {
  stageId: 'build-pilot',
  name: 'Build Pilot Lesson',
  description: 'Generate pilot lesson package from outline',
  requiresHumanReview: false,
  async execute(context) {
    // ... generate artifact
    return { artifacts: [result], status: 'completed' };
  },
};
```

## Architecture

- **types.ts** — Core type abstractions (Run, Stage, Artifact, Review, EngineDefinition)
- **artifact.ts** — RFC-0009 ArtifactEnvelope Zod schema
- **storage.ts** — StorageAdapter interface (swappable persistence)
- **runner.ts** — StageDefinition, StageContext, HumanReviewGate
- **trace-bridge.ts** — Evidence Trace creation and artifact/quality/review linkage

## Related

- RFC-0009: KDNA Artifact Contract
- RFC-0010: KDNA Fidelity Protocol
- KDNA Evidence Trace schema
