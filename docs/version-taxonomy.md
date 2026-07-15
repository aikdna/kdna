# KDNA Version Taxonomy

This document defines the current version coordinates and naming rules for the
KDNA ecosystem. Stable public names describe responsibilities, never product
generations.

## Responsibility Names

| Responsibility | Stable public name |
|---|---|
| Core implementation | `KDNA Core` |
| Distribution container | `KDNA Asset Container` |
| Agent-facing projection | `Runtime Capsule` |
| Pre-load decision | `LoadPlan` |
| Authoring input | `Studio project` or `dev source` |
| Distributed unit | `.kdna` asset or `distribution asset` |

Removed generation-labelled names are historical vocabulary, not aliases for
current responsibilities. They MUST NOT appear in current identifiers,
filenames, routes, examples, release tags, or narrative.

## Compatibility Coordinates

| Coordinate | Current value | Scope |
|---|---:|---|
| `format_version` | `0.1.0` | KDNA Asset Container contract |
| `compatibility.profile_version` | `0.1.0` | Selected payload profile contract |
| `contract_version` | contract-specific SemVer | Runtime, plan, trace, or evidence object |
| `protocol_version` | protocol-specific SemVer | Host exchange contract |

The container manifest has one current container coordinate. Removed
discriminators are rejected rather than interpreted as alternate supported
formats.

## Release Coordinates

Package, asset, and judgment releases use strict `MAJOR.MINOR.PATCH` values.
These coordinates answer different questions:

- package version: release of one implementation package;
- asset version: packaging or metadata release of one asset;
- judgment version: release of judgment-relevant content.

A package release does not create another KDNA format. An asset-only packaging
change does not imply a judgment change.

## Asset Filenames

Distribution filenames describe asset identity and end in `.kdna`. Version
coordinates belong inside `kdna.json`; they MUST NOT be embedded in filenames.

## Enforcement

The post-cutover audit scans every tracked path and text file, plus dry-run and
actual npm package contents. It has no blanket exclusions for RFCs, changelogs,
archives, or migration material. Exact third-party syntax may be allowed only
with a path, token, owner, and reason; KDNA-owned generation names are never
allowlisted.
