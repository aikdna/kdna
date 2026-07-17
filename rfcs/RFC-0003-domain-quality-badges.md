# RFC-0003: Domain Quality Badges

Status: withdrawn (historical quality-badge proposal)

> KDNA Core does not issue asset quality, trust, recommendation, risk, or
> production-readiness levels. An evaluator may publish an issuer-scoped,
> versioned assessment with an explicit subject, rubric, scope, method, time,
> and evidence; that assessment is not a Core property.

## Summary

Quality badges communicate the evidence level behind a KDNA asset.

## Badge Ladder

- `untested` — structurally valid only.
- `tested` — eval cases and known limitations are published.
- `validated` — repeatable benchmark improvement over baseline.
- `expert_reviewed` — independent expert review is recorded.
- `production_ready` — deployed with monitoring, rollback, and audit path.

## Normative Rules

- Quality badges MUST NOT be treated as self-contained safety guarantees.
- `tested` or higher SHOULD publish known limitations and eval evidence.
- Registry tools SHOULD warn when evidence fields are missing.
