# Changelog

## Unreleased

- Retire the legacy `@aikdna/agent`, `@aikdna/kdna-artifact-engine`, and
  `@aikdna/kdna-fidelity-core` publication surfaces. Their source workspaces are
  private historical references, their npm coordinates are deprecated, and
  current integrations use Core/CLI plus the loader or experimental MCP bridge.
- Remove intrinsic asset quality and risk authority from the current Runtime
  contract. Runtime manifests now reject protocol-owned quality, risk, trust,
  recommendation, certification, and production-readiness fields; Runtime
  Capsules and Judgment Reports no longer carry `risk_level` or
  `quality_badge`; and the old quality-badge, risk-tier, registry-trust, and
  mandatory-Human-Lock specifications are explicitly historical or withdrawn.
  External evaluations remain issuer-scoped, and load adoption remains caller
  policy.
- Replace the Core worktree publication path with a natural-SemVer-tag release
  authority. It binds the release event, tag, commit, tree, clean index, DCO,
  package version, and changelog; materializes two isolated sources from Git
  blobs; requires byte-identical npm 11.17 packs; retains one verified tarball;
  and revalidates evidence, registry identity, and the current tag before
  publication.
- Add an explicit `@aikdna/kdna-core/remote-runtime` server-side loading
  contract for deployers that control a packaged `access: "remote"` asset.
  It uses one immutable byte snapshot, forces a full JSON Runtime Capsule for
  server-internal projection, rejects multi-asset declarations and caller
  policy overrides, and leaves every ordinary consumer load entry point
  fail-closed at `needs_runtime` / `connect_runtime`.
- Enforce strict `compatibility.min_loader_version` coordinates across
  inspect, validate, default verification, LoadPlan, and load. Structurally
  valid assets that require a newer loader now fail closed with
  `KDNA_LOADER_VERSION_UNSUPPORTED` before projection.
- Remove generation-style prefixes from KDNA-owned entitlement, subscription,
  project, and verification routes; give active fixture responsibilities plain
  names; and extend the public naming gate with hash-bound retirements plus two
  exact third-party API exceptions.

## 0.13.2

**2026-06-22**

- Moved ajv + ajv-formats to dependencies for self-contained install path.

## 0.13.1

**2026-06-22**

- loadAsset reports profile_available and available_profiles, no silent scenario fallback.

## 0.13.0

**2026-06-22**

- planLoad returns structured input_fingerprint with entitlement state diagnostics.

---

## 0.9.0 — Phase 2: Judgment-Driven Artifacts and Products

**2026-06-08**

Phase 2 extends KDNA from "judgment asset protocol" to "judgment-driven artifact and product protocol." Seven new components span four layers — Protocol, SDK, Infrastructure, and Product — forming a complete chain from judgment loading to trusted, measurable, long-running delivery.

### Protocol

- **RFC-0009: Artifact Contract** — Standard envelope for KDNA-governed artifacts (identity, provenance, quality, trace, review lifecycle). Defines Stage Definition contract for multi-stage pipeline declaration. ([#68](https://github.com/aikdna/kdna/pull/68))
- **RFC-0010: Fidelity Protocol** — Measures whether domain judgment transferred into generated output. Three axes (triggered, changed, reached artifact). Blind A/B/C comparison with calibration anchors. Five-level per-axiom transfer classification. ([#69](https://github.com/aikdna/kdna/pull/69))
- **RFC-0011: Product Runtime** — Six-phase cycle for long-running product relationships: Schedule → Select → Generate → Deliver → Observe → Adapt. Preserves Human Judgment Lock boundary (operational changes only, never judgment changes). ([#71](https://github.com/aikdna/kdna/pull/71))

### SDK

- **@aikdna/kdna-artifact-engine** — TypeScript reference SDK for RFC-0009. ArtifactEnvelope (Zod), StageDefinition, StorageAdapter interface, HumanReviewGate. 5 tests. ([#70](https://github.com/aikdna/kdna/pull/70))
- **@aikdna/kdna-fidelity-core** — TypeScript reference SDK for RFC-0010. Pure functions (zero LLM dependencies): classifyVerdict, computeStats (CI95), normalizeGap, classifyCalibrationQuality, classifyTransferLevel. 18 tests. ([#70](https://github.com/aikdna/kdna/pull/70))

### Infrastructure

- **WorkPack Pipeline** — Multi-stage orchestration manifest for kdna-workpack. DAG dependencies, parallel execution, artifact flow between stages, per-stage KDNA overrides, human review gates. (See WorkPack Pipeline docs.)
- **Registry Fidelity Gate** — Fidelity evidence as a requirement for validated+ quality badges. Trust gate enforces score ≥ 0.70, public report URL, calibration validity, and positive blind delta. (Note: registry is out of scope for KDNA Core; this gate is currently informational only.)

### CLI

- **kdna protocol validate** — Validate JSON files against RFC-0009/0010/0011 schemas. Supports artifact-envelope, stage-definition, fidelity-result, and product-runtime schemas. ([kdna-cli#2](https://github.com/aikdna/kdna-cli/pull/2))
- **kdna protocol inspect** — Summarize protocol artifacts with structured output. ([kdna-cli#2](https://github.com/aikdna/kdna-cli/pull/2))

### Demo & Docs

- **E2E Coaching Demo** — Zero-dependency Node.js demo showing full protocol chain: KDNA load → 3-stage pipeline → ArtifactEnvelope → fidelity measure → FidelityResult. Per-axiom transfer levels with CI95 confidence intervals. (See demos/skill-plus-kdna-demo in this repo.)
- **Phase 2 Architecture** — Integration matrix, data flow diagram, and non-goals for all seven components. ([#74](https://github.com/aikdna/kdna/pull/74))
- **RFC Status Tracking** — Five-level lifecycle: Draft → Accepted → Implemented → Stable → Deprecated. ([#74](https://github.com/aikdna/kdna/pull/74))

### Fixes

- P0: Lockfile regenerated with new SDK packages, fixing root `npm ci` ([#73](https://github.com/aikdna/kdna/pull/73))
- P0: SDK packages renamed to `@aikdna/` scope convention ([#73](https://github.com/aikdna/kdna/pull/73))
- P0: CI workflow references updated to new package names ([#72](https://github.com/aikdna/kdna/pull/72), [#73](https://github.com/aikdna/kdna/pull/73))

---

Historical note: 0.10.x–0.12.x were pre-general-availability cleanup releases. Full human-readable release notes resume from 0.13.0.

## 0.7.0 — 1.0-rc: Open Judgment Protocol

> **Supersession note (2026-06-27)**: The 0.7.0 release was tagged "1.0-rc" at the time (2026-05-13). The 0.7 line was subsequently re-anchored to the @aikdna/* npm scope with registry 2.0 (2026-05-22). The "1.0-rc" label below is historical; current docs use the 0.7.x numbering.

**2026-05-13**

Initial public release of the KDNA Protocol 1.0-rc. Core specification, CLI runtime, domain assets, agent integrations, and registry infrastructure.
