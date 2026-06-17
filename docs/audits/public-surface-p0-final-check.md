# P0 Public Surface Final Check — June 2026

Date: 2026-06-17
Phase: KDNA Public Surface Finalization Sweep — P0

## Scope

External first-impression surfaces: READMEs, start-here.md, GitHub repo
descriptions, npm descriptions, website key pages.

## Files checked

| Surface | File/URL | Status |
|---|---|---|
| kdna README.md | main repo root | ✓ clean (PR-97) |
| kdna README.zh.md | main repo root | ✓ clean (PR-98a) |
| kdna docs/start-here.md | main repo navigation entry | ✓ fixed (P0 sweep) |
| kdna package.json | main repo metadata | ✓ fixed (P0 sweep) |
| kdna GitHub desc | aikdna/kdna repo description | ✓ fixed (P0 sweep) |
| kdna-cli README.md | npm package entry | ✓ fixed (P0 sweep, PR#11) |
| kdna-registry README | registry repo | ✓ clean (legacy banner) |
| kdna-website pages | aikdna.com | ✓ clean (PR-98c) |
| npm @aikdna/kdna-cli | npm registry | ✓ OK |
| npm @aikdna/kdna-core | npm registry | ✓ OK |
| npm @aikdna/kdna | npm registry | ✓ OK |

## Hits found and fixed

| Surface | Old wording | New wording |
|---|---|---|
| start-here.md | "KDNA is an open protocol" | "KDNA Core is the official KDNA judgment-asset format and runtime loading contract" |
| start-here.md | Repo Map: "Protocol, SPEC, conformance" / registry as "0 — Core" | Restructured: official toolchain table + legacy table + domain examples. Registry marked "legacy registry experiment" |
| start-here.md | Current State: "v1.0-rc", links to STATE_OF_KDNA.md | "KDNA Core v1 (kdna_version: 1.0) is the official KDNA judgment-asset format" |
| package.json | "KDNA protocol specification, core library, and domain registry." | "KDNA Core — official KDNA judgment-asset format, runtime loading contract, and official toolchain." |
| GitHub desc | "Open protocol for turning human-led judgment systems..." | "KDNA Core — official KDNA judgment-asset format and runtime loading contract." |
| kdna-cli README | "KDNA Ecosystem: kdna, KDNAChat, KDNAStudio, KDNAWork, Registry" bar | "KDNA Core v1 is the official KDNA judgment-asset format" |
| kdna-cli README | "official reference implementation" (3 instances) | "official KDNA runtime CLI" / "official CLI entry of the KDNA toolchain" |
| kdna-cli README | "Default Registry" / registry schema v3 / KDNA_REGISTRY_URL narrative | "Legacy Registry (deprecated)" section; v1 CLI route shown as the active path |
| kdna-cli README | "Product Matrix": KDNAChat / Registry / Governance Console | "Official toolchain components": KDNA Core / Core Library / Runtime / Authoring |
| kdna-cli README | "Open Source and Commercial Boundary" (quality badge review / managed registry / enterprise private registry) | Removed; replaced with "Official toolchain components" and redirect to v1 Core docs |
| kdna-cli README | "Related: KDNA Registry — Domain catalog" | Removed; only official toolchain links remain |

## Unfixed & reason

| Item | Status |
|---|---|
| kdna-cli exit code `REGISTRY_ERROR` | Code constant, not removed; documented in "Legacy Registry" section |
| kdna-cli source code (src/*) | Not in P0 scope; belongs to PR-99 (core extraction) / PR-101+ |
| kdna-studio-core README | P1 scope — will be handled in next phase |
| kdna-vscode README | P1 scope |
| Domain repos README/kdna.json | P1/P2 scope |

## P0 final status: PASS

All external first-impression surfaces now convey the official KDNA Core
v1 message. No active "open protocol / reference implementation / open
standard / registry as active path / viewer / reader / player / MP4
analogy" remains on any P0 surface.
