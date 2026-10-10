# Open Source Pre-release Maintenance Baseline

> Last updated: 2026-07-21. This document defines the public pre-release
> maintenance boundary for the KDNA open-source ecosystem. It does not freeze
> or retire any repository mission.

## Lifecycle Map

The version and capability descriptions below are the recorded 2026-07-21
maintenance snapshot. Current source versions and verified scope are tracked
in [Component reception status](./component-reception-status.md) and each
repository README; historical release coordinates do not describe current source.

| Surface | Lifecycle | Maintenance claim |
|---|---|---|
| Protocol, schemas, conformance fixtures | Pre-release | Format and loader contract changes require tests and public evidence. |
| `@aikdna/kdna-core` and `@aikdna/kdna-cli` | Pre-release | Local public `.kdna` assets are the supported first-run path. |
| `@aikdna/kdna-eval` | Experimental | Issuer-scoped evaluation, replay, budget, and consumption evidence; not KDNA Core content authority. |
| `@aikdna/kdna` | Legacy compatibility | Maintained migration bridge; new integrations use `@aikdna/kdna-cli` and `@aikdna/kdna-core` directly. |
| Studio Core and Studio CLI | Pre-release | Public local asset authoring/export is supported; AI-assisted authoring remains experimental. |
| Public `.kdna` reference assets | Experimental | Current technical references require metadata, SHA sidecars, public URLs, and public-surface checks; they are not content endorsements or the default onboarding path. |
| Agent loader skill and MCP server | Unassessed / Experimental | Loader mission retained; explicit-file/user-approved attachment, visibility, and control require independent recertification. |
| `create-kdna-web-app` (scaffolder) | Not on the current public surface | npm: 8 versions, none deprecated, latest `0.5.0`, still installable and pinnable. Deprecation is a separate decision (see the dated note below). |
| `kdna-web-server` | Not on the current public surface | npm: 8 versions, all 8 deprecated, latest `0.3.1`, still installable for existing pinned installs. |
| `kdna-web-client` | Not on the current public surface | npm: 7 versions, all 7 deprecated, latest `0.3.0`. **This package is still a dev dependency of the `kdna` root graph at `0.3.0`, resolved from the registry.** |
| `kdna-react` | Not on the current public surface | npm: 6 versions, all 6 deprecated, latest `0.4.0`. |
| `kdna-activation-server` | Not on the current public surface | npm: 4 versions, all 4 deprecated, latest `0.2.1`. |
| `kdna-remote-server` | Not on the current public surface | npm: 8 versions, all 8 deprecated, latest `0.4.2`. |
| `kdna-demo-web-viewer` | Not on the current public surface | no npm package. |
| Swift runtime, Studio Swift, and app-shared package | Pre-release | The recorded Swift Core 0.20.0 conformance release; Studio Swift 0.4.0 and App Shared 0.5.0 remain published but require current-runtime recertification before stronger claims. |
| `kdna-vscode` | Not on the current public surface | Repository is private; no npm package. The editor mission remains part of the ecosystem, and current source maturity and exact compatibility await owner-reviewed recertification. |
| `@aikdna/agent` | Legacy / Deprecated | Frozen source only; new integrations use explicit Core/CLI file loading while Agent adapters are recertified. |
| `@aikdna/kdna-artifact-engine` and `@aikdna/kdna-fidelity-core` | Legacy / Deprecated | Historical draft implementations; not part of the current Runtime Capsule toolchain. |

The machine-readable published-line lifecycle and release-status inventory is

**Entry changes (2026-10-10).** The repositories listed above as not on the
current public surface are no longer part of it. Already-published npm packages
are unaffected and remain installable, and the `kdna` root development graph
still depends on `@aikdna/kdna-web-client`, as its own row records. Historical
source remains obtainable through repository history. No defect in any of these
repositories is fixed by this change, and none of them is declared retired by it.
The npm figures above are per-row measurements of the registry, taken at this
date.

**Residual risks that remain open, and are not closed by the surface change:**
`create-kdna-web-app` still distributes an older vulnerable dependency —
deprecation states that maintenance and recommendation stop, and is not a
vulnerability fix; `kdna-remote-server` can be exhausted; `kdna-react` can
re-render without bound.

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
