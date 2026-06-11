# KDNA Card Specification

Every KDNA domain SHOULD publish a KDNA Card — a standardized metadata document describing the domain's purpose, risks, provenance, and governance status.

## Purpose

The KDNA Card serves the same role as a model card in machine learning: it helps deployers make responsible decisions about whether and how to use a KDNA domain.

## Format

```json
{
  "name": "@aikdna/leadership_decisions",
  "version": "0.1.0",
  "risk_level": "R1",
  "intended_use": [
    "Diagnosing team execution failures",
    "Evaluating whether a meeting produced a real decision",
    "Assessing decision speed vs decision quality trade-offs"
  ],
  "out_of_scope": [
    "Hiring and termination decisions",
    "Legal compliance assessment",
    "Individual performance evaluation"
  ],
  "known_limitations": [
    "This domain was developed from leadership coaching experience with teams of 5-50 people. It has not been tested in very large organizations or military contexts.",
    "The domain assumes a baseline of organizational stability. It may not apply during crisis or rapid restructuring."
  ],
  "author_responsibility": "The encoded judgment represents 15 years of leadership coaching across 200+ teams. The author takes responsibility for the judgment patterns encoded in this domain.",
  "risk_warnings": [
    "This domain may not apply to safety-critical leadership decisions",
    "The 'speed over perfection' axiom should NOT be applied to irreversible resource commitments"
  ],
  "human_lock_summary": {
    "locked_cards": 10,
    "locked_axioms": 3,
    "locked_misunderstandings": 2,
    "locked_self_checks": 5,
    "feynman_restatements": 5,
    "locked_by": "leadership_expert",
    "locked_at": "2026-05-23"
  },
  "quality_badge": "tested",
  "review_status": "community",
  "requires_expert_review": false,
  "provenance": {
    "studio_core": "aikdna/kdna-studio-core",
    "studio_core_version": "1.4.2",
    "build_id": "build_xxx",
    "content_fingerprint": "sha256:xxx",
    "built_at": "2026-05-23T10:00:00Z"
  },
  "license": "CC-BY-4.0"
}
```

## Required Fields

| Field | Required At | Description |
|-------|:----------:|-------------|
| `name` | Always | Domain name |
| `version` | Always | Domain version |
| `risk_level` | Always | R0/R1/R2/R3 |
| `intended_use` | Always | What this domain is designed for |
| `out_of_scope` | Always | What this domain explicitly does NOT cover |
| `known_limitations` | Always | What the domain cannot do or was not tested for |
| `author_responsibility` | R1+ | Who stands behind the encoded judgment |
| `risk_warnings` | R2+ | Specific warnings for dangerous misapplication |
| `human_lock_summary` | Always | Lock status of each card type |
| `quality_badge` | Always | untested/tested/validated/expert_reviewed/production_ready |
| `review_status` | Always | unlisted/community/verified/reviewed/trusted |
| `provenance` | Always | Build tool, version, fingerprint, timestamp |
| `license` | Always | SPDX license identifier |

## Generation

KDNA Studio Core generates a `KDNA_CARD.json` as part of the compile output when `governance` metadata is present on the project. The card is included in the `.kdna` container.
