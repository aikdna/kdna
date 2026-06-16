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
| RFC-0012 | Artifact Envelope (output artifact) | **Draft** | `specs/RFC-0012-artifact-contract.md` (companion to RFC-0009; output-side envelope) |
| RFC-0013 | Judgment Asset Lifecycle | **Draft** | `specs/RFC-0013-judgment-asset-lifecycle.md` (companion RFCs RFC-0014 / RFC-0015 now also filed) |
| RFC-0014 | KDNA Card Spec v2 | **Draft** | `specs/RFC-0014-kdna-card-v2.md` (companion to RFC-0013; field-level extension, not implementation) |
| RFC-0015 | Runtime Trace Spec v2 | **Draft** | `specs/RFC-0015-runtime-trace-v2.md` (companion to RFC-0013; field-level extension, not implementation) |

## Lifecycle Rules

1. RFCs start as **Draft** — open for comment, may change significantly.
2. After review (≥1 maintainer approval), promoted to **Accepted**.
3. Once reference implementation exists and passes CI, promoted to **Implemented**.
4. After ≥30 days in production without breaking changes, promoted to **Stable**.
5. Superseded RFCs are marked **Deprecated** with a link to the replacement.

## Current State (2026-06-16)

```
RFC-0009 Artifact Contract     ████████████░░░░  Implemented
RFC-0010 Fidelity Protocol     ████████████░░░░  Implemented
RFC-0011 Product Runtime       ████████░░░░░░░░  Accepted
RFC-0012 Artifact Envelope     ██░░░░░░░░░░░░░░  Draft
RFC-0013 Judgment Asset Life.  █░░░░░░░░░░░░░░░  Draft (companion RFCs filed; see note)
RFC-0014 Card v2                █░░░░░░░░░░░░░░░  Draft
RFC-0015 Trace v2              █░░░░░░░░░░░░░░░  Draft
```

> **Note on RFC-0013 status (2026-06-16):** RFC-0013 §9 acceptance
> criteria are now **technically covered** by the implementation
> series (PR-1 / PR-2 / PR-2a / PR-3 / PR-4 / PR-4b), plus the
> filing of RFC-0014 and RFC-0015 (this update). However, RFC-0013
> is **not** promoted to `Accepted` or `Implemented` here. The
> public status remains `Draft` until external review and approval
> ratifies the implementation. The accurate external wording is:
> *"RFC-0013 implementation acceptance criteria are now covered;
> external approval / final status update pending."*
