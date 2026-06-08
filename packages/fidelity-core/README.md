# @kdna/fidelity-core

Reference SDK for measuring judgment transfer fidelity in KDNA-governed artifacts.

## Zero LLM Dependencies

This package contains only **deterministic, pure functions** — no LLM calls,
no AI SDK dependency. The fidelity measurement logic (`classifyVerdict`,
`computeStats`, `normalizeGap`, etc.) is pure math and can run in any
JavaScript environment.

LLM-dependent fidelity operations (blind comparison, task generation, profile
validation) belong in a separate `@kdna/fidelity-engine` package.

## Naming Convention

This SDK uses **camelCase** for TypeScript identifiers. KDNA protocol schemas
and RFC documents use **snake_case** for JSON field names.

| TypeScript (camelCase) | JSON / RFC-0010 (snake_case) |
|------------------------|------------------------------|
| `fidelityId` | `fidelity_id` |
| `protocolVersion` | `protocol_version` |
| `overallScore` | `overall_score` |
| `passThreshold` | `pass_threshold` |
| `targetArtifact` | `target_artifact` |
| `sourceKdna` | `source_kdna` |
| `perAxiom` | `per_axiom` |
| `transferLevel` | `transfer_level` |
| `blindDelta` | `blind_delta` |
| `crossModelVariance` | `cross_model_variance` |

## Usage

```typescript
import { classifyVerdict, computeStats, normalizeGap, GAP_THRESHOLDS } from '@kdna/fidelity-core';

const verdict = classifyVerdict({
  transferGap: 0.45,
  naiveDrift: 0.2,
  gapWidth: 0.5,
  oldNewDivergence: 'Treatment uses KDNA diagnostic framework',
  naiveSimilarity: 'Naive output resembles general advice',
});
// → 'partial_transfer'

const stats = computeStats([
  { transferGap: 0.5, convergenceScore: 0.3 },
  { transferGap: 0.7, convergenceScore: 0.5 },
]);
// → { meanTransferGap: 0.6, stdDevTransferGap: 0.1, ci95Lower: ..., ci95Upper: ... }
```

## API

### Verdict Classification
- `classifyVerdict(metrics)` → `GapVerdict` — classify transfer strength
- `interpretVerdict(verdict)` → `string` — human-readable interpretation

### Statistics
- `computeStats(results)` → `{ meanTransferGap, meanConvergence, stdDevTransferGap, ci95Lower, ci95Upper, taskCount }`
- `normalizeGap(real, negative, positive)` → `number` — calibrate against control anchors

### Transfer Classification
- `classifyTransferLevel(score)` → `string` — map 0-1 score to transfer level
- `classifyCalibrationQuality(neg, pos)` → `'good' | 'poor' | 'inverted'`

### Constants
- `GAP_THRESHOLDS` — `{ strong: 0.5, partial: 0.25, weak: 0.1 }`

## Related

- RFC-0010: KDNA Fidelity Protocol
- RFC-0009: KDNA Artifact Contract
