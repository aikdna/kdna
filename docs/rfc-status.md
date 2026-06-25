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
| RFC-0013 | Judgment Asset Lifecycle | **Implemented** | `schema/source_authority.schema.json` + `schema/truth_charter.schema.json` + `schema/module_manifest.schema.json` (PR-1, aikdna/kdna #86); `SPEC.md` §1.6.3 Anti-Monolithic (PR-2a, aikdna/kdna #87); `aikdna/kdna-cli` Anti-Monolithic CLI lint (PR-2, #10); `aikdna/kdna-studio-core` SAG/TC compile gates (PR-3, #3); `the E2E test lab` lifecycle smoke (PR-4, #3) + default-synthesis migration smoke (PR-4b, #4); companion Drafts `specs/RFC-0014-kdna-card-v2.md` + `specs/RFC-0015-runtime-trace-v2.md` (Phase 2, aikdna/kdna #88); evidence pack `docs/audits/rfc-0013-implementation-evidence-pack.md` |
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
RFC-0013 Judgment Asset Life.  ████████████░░░░  Implemented (see note)
RFC-0014 Card v2                █░░░░░░░░░░░░░░░  Draft
RFC-0015 Trace v2              █░░░░░░░░░░░░░░░  Draft
```

> **Note on RFC-0013 status (2026-06-16):** RFC-0013 is
> **Implemented** based on technical acceptance coverage and
> remote audit; not yet `Stable`. The reference implementation is
> shipped across four repositories (kdna, kdna-cli,
> kdna-studio-core, lab (private)); §9 acceptance criteria are 7/7
> technically covered; the evidence pack and governance rule
> are in place. Follow-up work remains for atomspeak
> (PR-5), Card v2 implementation (RFC-0014), Trace v2
> implementation (RFC-0015), and the Anti-Monolithic
> question-count heuristic (currently a CLI debt). External
> review is welcome but is not a precondition for this
> `Implemented` status promotion.
