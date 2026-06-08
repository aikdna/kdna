# KDNA RFC Status

## Status Levels

| Status | Meaning |
|--------|---------|
| **Draft** | Proposal written, open for review and discussion |
| **Accepted** | Reviewed, approved by maintainers, ready for implementation |
| **Implemented** | Reference implementation exists, schema published, tests pass |
| **Stable** | In production use, no breaking changes expected |
| **Deprecated** | Superseded by a newer RFC or withdrawn |

## RFC Index

| RFC | Title | Status | Implemented In |
|-----|-------|--------|----------------|
| RFC-0009 | Artifact Contract | **Implemented** | `specs/artifact-envelope.schema.json`, `specs/stage-definition.schema.json`, `@aikdna/kdna-artifact-engine` |
| RFC-0010 | Fidelity Protocol | **Implemented** | `specs/fidelity-result.schema.json`, `@aikdna/kdna-fidelity-core` |
| RFC-0011 | Product Runtime | **Accepted** | `specs/product-runtime.schema.json`, `examples/product-runtime/` |

## Lifecycle Rules

1. RFCs start as **Draft** — open for comment, may change significantly.
2. After review (≥1 maintainer approval), promoted to **Accepted**.
3. Once reference implementation exists and passes CI, promoted to **Implemented**.
4. After ≥30 days in production without breaking changes, promoted to **Stable**.
5. Superseded RFCs are marked **Deprecated** with a link to the replacement.

## Current State (2026-06-08)

```
RFC-0009 Artifact Contract    ████████████░░░░  Implemented
RFC-0010 Fidelity Protocol    ████████████░░░░  Implemented
RFC-0011 Product Runtime      ████████░░░░░░░░  Accepted
```
