# KDNA product map

> Last verified: 2026-09-13. Every row states only what is actually available
> today; nothing here promises a download, a platform or a date that does not
> already exist.

Several entry points carry similar names and very different capabilities. This
page says who each one is for, what it does, which asset generation it supports,
and whether it can be downloaded right now.

| Entry | For whom | What it does | Asset generation supported | Available now |
|---|---|---|---|---|
| **KDNA protocol and specification** (`aikdna/kdna`) | Implementers, authors, reviewers | Defines the container, manifest, payload, load contract, Runtime Capsule and conformance fixtures; owns the normative index | The Active `0.1.0` container/payload design | Yes, in this repository |
| **KDNA CLI** (`@aikdna/kdna-cli`) | Developers creating and inspecting assets | Terminal toolchain for the published line: inspect, validate, pack, unpack, plan and load | The Active published design | Yes, from the npm registry |
| **Static Inspector** (`docs/inspector/index.html`) | Developers needing a quick look at a container | One static browser page that inspects a locally chosen `.kdna` file with no install and no server | Whatever its bundled client accepts (it bundles `@aikdna/kdna-web-client@0.3.0`); it is **not verified** against the unpublished candidate graph | Yes, as a page in this repository |
| **Demo viewer** (`aikdna/kdna-demo-web-viewer`) | Developers evaluating the Web/React/Read path | A private, loopback-only Next.js example that performs one explicit public Read at a time | The exact graph vendored in that repository; cross-request expansion is `NOT_PROVEN` | Source only; it is a developer example, not a product |
| **KDNA Work distribution** (`aikdna/kdna-work-releases`) | People who want the general-purpose Agent application | Binary-only release repository for that application | Not a KDNA reader or authoring tool | **Not yet**: no installers, no update feed, download endpoints return `410 Gone` |
| **Human reading product** | People who want to read an asset without developer tooling | A focused reader for a user-selected `.kdna` file | Not applicable | **Not delivered**: there is no public repository, download or package. Treat any future availability as a separate announcement, not as implied by this map |

## What this map does not say

- A developer example is not a product. The demo viewer proves an integration
  path; it does not ship as a consumer application.
- The static Inspector is not the human reading product. It is a page pinned to
  an earlier published client, and it is not evidence about the candidate graph.
- The distribution repository being public does not mean anything is
  downloadable from it. Its own README states that distribution is gated.
- Nothing here claims macOS, Windows, mobile or store availability. Platform
  support is stated only where a specific artifact and its verification exist.
- A row marked "not delivered" is a statement of current absence, not a release
  schedule.

## Closest entry for a first evaluation

For an installable first run of the published line, start from
[`docs/status.md`](./status.md). For the unpublished Core/Read candidates, see
[`docs/core-read-current-status.md`](./core-read-current-status.md) and the
coordinate split in
[`docs/version-and-capability-matrix.md`](./version-and-capability-matrix.md).
