# Changelog

## 0.3.2 (2026-07-19)

- Make the ESM root export the same score constants as the CommonJS root.
- Complete the TypeScript value declarations for every root runtime export,
  including replay, gates, cost, consumption, route-card, and consumer-index
  helpers.
- Give every public package subpath its own exact declaration surface, align
  the loader validators across CommonJS and ESM, and type the supported replay
  and Cluster API compositions without broad `any` fallbacks.
- Default direct score-regression detection to the same five-percent tolerance
  used by replay runs, and correct the executable cost-tracker example.
- Add fail-closed public-surface and packed TypeScript consumer regression
  checks across the root and all ten subpaths so runtime and declaration
  exports cannot drift silently again.
- Reject malformed, empty, duplicate, or below-threshold Assay fixture sets
  before invoking a runner, and require non-empty task and expected evidence.
- Require structurally valid Cluster fixtures and identifiers, prevent empty or
  invalid fixture evidence from producing a passing Cluster verdict, and make
  Cluster Replay reject incomplete result sets.
- Count replay success only when `pass === true`; missing or non-boolean pass
  evidence is failed and reported as incomplete instead of becoming an implicit
  success.
- Fully validate the nested Domain, Persona, RouteCard, and ConsumerIndex
  shapes promised by TypeScript, including fallback-loaded defaults, and make
  consumer-index resolution and trust checks fail safely on malformed input.
- Require exactly one of each documented Asset Assay baseline arm before a
  runner is invoked; empty, partial, duplicate, unknown, or malformed arm sets
  cannot produce a passing report.
- Bind Asset and Cluster dataset fingerprints to canonical evaluation content,
  not fixture IDs alone. Object key order is normalized, task and expected
  evidence mutations change the hash, and non-JSON evidence fails validation.
- Validate Cluster manifest identifiers and product-gate fields before
  producing the strongly typed report, while preserving documented defaults
  when optional identifiers are absent.
- Bind a passing Cluster Assay to one valid selected primary, exact fixture
  expectations, verified loaded primary/advisor assets, and non-loaded rejected
  assets; missing, duplicate, blocked, or mismatched identities fail closed.
- Require all seven comparison arms exactly once, with finite 1–5 scores,
  nonnegative result/error counts, and the exact fixture ID set for every arm.
- Require explicit Cluster budget and observed execution-cost evidence. Zero
  observed tokens remain zero; missing cost data is never replaced with a
  passing synthetic estimate.

## 0.3.1 (2026-07-12)

- Add fail-closed Asset Assay and five-gate Cluster Assay contracts.
- Treat missing behavioral or observed trust evidence as `not_run`, never as a
  passing promotion result.
- Keep routing, answer quality, economics, trust, and product readiness as
  separate gates; no average score can compensate for a failed hard gate.
- Accept preregistered blind scores and support the documented “mean
  improvement OR critical-error reduction” Asset Assay threshold.
- Count runner errors as harmful in high-risk and regression fixtures.
- Add public TypeScript declarations for Asset Assay, Cluster Assay, evidence
  claims, classification, comparison arms, and gate reports.
- Add strict TypeScript checking to the package release gate.

## 0.2.0

- Add replay evaluation, multi-gate composition, cost tracking, route cards,
  consumer indexes, and consumption evaluation helpers.
