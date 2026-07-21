# Open Source Pre-release Maintenance Baseline

> Last updated: 2026-07-21. This document defines the public pre-release
> maintenance boundary for the KDNA open-source ecosystem. It does not freeze
> or retire any repository mission.

## Lifecycle Map

| Surface | Lifecycle | Maintenance claim |
|---|---|---|
| Protocol, schemas, conformance fixtures | Pre-release | Format and loader contract changes require tests and public evidence. |
| `@aikdna/kdna-core` and `@aikdna/kdna-cli` | Pre-release | Local public `.kdna` assets are the supported first-run path. |
| `@aikdna/kdna-eval` | Experimental | Issuer-scoped evaluation, replay, budget, and consumption evidence; not KDNA Core content authority. |
| `@aikdna/kdna` | Legacy compatibility | Maintained migration bridge; new integrations use `@aikdna/kdna-cli` and `@aikdna/kdna-core` directly. |
| Studio Core and Studio CLI | Pre-release | Public local asset authoring/export is supported; AI-assisted authoring remains experimental. |
| Public `.kdna` reference assets | Experimental | Current technical references require metadata, SHA sidecars, public URLs, and public-surface checks; they are not content endorsements or the default onboarding path. |
| Agent loader skill and MCP server | Unassessed / Experimental | Loader mission retained; explicit-file/user-approved attachment, visibility, and control require independent recertification. |
| Web packages and scaffolder | Pre-release / Experimental | Published integration surfaces for upload, inspect, plan-load, load, and activation proxying. |
| Swift runtime, Studio Swift, and app-shared package | Pre-release | Swift Core has a current 0.20.0 conformance release; Studio Swift 0.4.0 and App Shared 0.5.0 remain published but require current-runtime recertification before stronger claims. |
| `kdna-vscode` | Unassessed integration | The editor mission remains part of the ecosystem; current source maturity and exact compatibility await owner-reviewed recertification. |
| `@aikdna/agent` | Legacy / Deprecated | Frozen source only; new integrations use explicit Core/CLI file loading while Agent adapters are recertified. |
| `@aikdna/kdna-artifact-engine` and `@aikdna/kdna-fidelity-core` | Legacy / Deprecated | Historical draft implementations; not part of the current Runtime Capsule toolchain. |

The machine-readable lifecycle and release-status inventory is
[`ecosystem-manifest.json`](../ecosystem-manifest.json). Its schema distinguishes
active packages, the compatibility bridge, deprecated coordinates, source-only
applications, and exact release artifacts.

## Accepted Maintenance Work

Pre-release maintenance PRs should fit one or more of these categories:

- Bug fixes with a minimal regression test or reproduction.
- Documentation truth fixes that align public claims with shipped behavior.
- Conformance vectors, schema tests, or loader contract tests.
- Security fixes, dependency hygiene, or supply-chain hardening.
- Small compatibility updates that preserve the public local asset path.
- Release evidence refreshes for packages, assets, and integration surfaces.

## Out of Scope for KDNA Core

These areas should not expand the KDNA Core surface unless an accepted
RFC changes the boundary:

- Public registry or marketplace.
- Hosted loading service.
- Paid distribution platform.
- Content ranking, certification, or quality badges.
- Generic app marketplace infrastructure.
- Commercial authorization product flows beyond self-hosted primitives.
- Preemptive abstractions that are not proven by real product integration.

## Minimum Evidence Matrix

| Area | Required evidence before stronger public claims |
|---|---|
| Protocol / JS Core | `npm test`, conformance suite, pack check, release preflight. |
| CLI | Full CLI test suite and fixture side-effect inspection. |
| Assets | Metadata audit, public-surface check, SHA sidecars, reachable release URLs. |
| Web packages | Package CI, source/npm version alignment, generated-app smoke test. |
| Swift / Apple support | `swift build`, `swift test`, CI success, CodeQL or code-scanning evidence. |
| Documentation | Docs CI, public truth validation, manifest validation, no private-path leaks. |

## Maintenance Rhythm

- Weekly: issue triage, CI review, npm audit/security advisory review.
- Monthly: dependency and release-evidence refresh where packages changed.
- Per release: update package versions, changelogs, public truth docs, and
  evidence notes in the same PR or release checklist.

The open-source layer should now bias toward verification and compatibility.
New functionality belongs in product applications first, then returns to the
open layer only when repeated product use proves the boundary.
