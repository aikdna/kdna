# Open Source Maintenance Baseline

> Last updated: 2026-07-04. This document defines the public maintenance-mode
> boundary for the KDNA open-source ecosystem.

## Lifecycle Map

| Surface | Lifecycle | Maintenance claim |
|---|---|---|
| Protocol, schemas, conformance fixtures | Stable | Format and loader contract changes require tests and public evidence. |
| `@aikdna/kdna-core` and `@aikdna/kdna-cli` | Beta | Local public `.kdna` assets are the supported first-run path. |
| Studio Core and Studio CLI | Beta | Public local asset authoring/export is supported; AI-assisted authoring remains experimental. |
| Public `.kdna` assets | Beta | Releases require metadata, SHA sidecars, public URLs, and public-surface checks. |
| Agent loader skill and MCP server | Beta / Experimental | Loader behavior must preserve plan-load-before-load and content-neutral boundaries. |
| Web packages and scaffolder | Experimental | Published integration surfaces for upload, inspect, plan-load, load, and activation proxying. |
| Swift runtime and app-shared package | Beta | Support surfaces until parity and release evidence are refreshed after public release. |
| `kdna-vscode` | Legacy | Historical reference only; current workflows use CLI, Studio CLI, and loader integrations. |

## Accepted Maintenance Work

Maintenance-mode PRs should fit one or more of these categories:

- Bug fixes with a minimal regression test or reproduction.
- Documentation truth fixes that align public claims with shipped behavior.
- Conformance vectors, schema tests, or loader contract tests.
- Security fixes, dependency hygiene, or supply-chain hardening.
- Small compatibility updates that preserve the public local asset path.
- Release evidence refreshes for packages, assets, and integration surfaces.

## Out Of Scope For Core v1

These areas should not expand the Core v1 open-source surface unless a later
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
