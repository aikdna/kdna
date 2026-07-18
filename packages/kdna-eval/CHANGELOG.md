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
