# ~/.kdna Directory Specification v1.0

> **Status:** Draft · 2026-05-26
> **Applies to:** kdna-cli, compatible clients, authoring tools

## Purpose

Define the canonical local directory structure for all KDNA products. Every product MUST use `~/.kdna/` as its local KDNA home. Products that store KDNA data elsewhere break ecosystem interoperability.

KDNA's canonical installed object is a `.kdna` asset. Products MUST NOT treat extracted domain directories as installed runtime domains.

## Directory Structure

```
~/.kdna/
│
├── config.json                  # Global configuration
├── index.json                   # Installed asset index
│
├── packages/                    # Canonical installed .kdna assets
│   └── @aikdna/
│       └── writing/
│           └── 0.7.2/
│               ├── writing-0.7.2.kdna
│               └── receipt.json
│
├── clusters/                    # Cluster manifests
│   └── animation.json
│
├── registry/                    # Local registry cache
│   ├── domains.json             # Cached registry v3 index + trust metadata
│   └── manifests/               # Individual registry manifests
│
├── traces/                      # Judgment traces
│   └── YYYY-MM-DD/
│       └── <trace_id>.json
│
├── feedback/                    # Feedback events
│   └── YYYY-MM-DD/
│       └── <event_id>.json
│
├── evals/                       # User eval cases
│   └── <domain>/
│       └── <case>.json
│
├── cache/                       # Rebuildable runtime cache
│   └── ...
│
├── identity/                    # Author/developer identity
│   ├── keypair.json
│   └── pubkey.json
│
└── licenses/                    # Enterprise/pro license files
    └── <license_id>.lic
```

## Invariants

- `packages/` contains the real installed assets.
- `index.json` records installed asset names, versions, local asset paths, and receipt paths.
- `receipt.json` records install source, `asset_digest`, `content_digest`, signature status, access mode, install time, and local asset path.
- `registry/domains.json` records registry v3 trust metadata, including snapshot expiry, timestamp expiry, and revocations.
- `cache/` MAY contain temporary extracted files, but cache contents are not canonical and may be deleted.
- `domains/` is not part of the runtime model.
- Installers MUST NOT rewrite `kdna.json` inside an installed `.kdna` asset.

## Product Responsibilities

| Product | Reads from | Writes to |
|---------|------------|-----------|
| kdna-cli | `packages/`, `index.json`, `registry/` | `packages/`, `index.json`, `identity/`, `licenses/` |
| a KDNA-compatible client | `packages/`, `index.json`, `config.json` | `traces/`, `feedback/` |
| Authoring environment | dev source workspaces, `identity/` | `.kdna` assets, `identity/` |

## Install Layout

Installing `@aikdna/writing@0.7.2` MUST produce:

```
~/.kdna/packages/@aikdna/writing/0.7.2/writing-0.7.2.kdna
~/.kdna/packages/@aikdna/writing/0.7.2/receipt.json
~/.kdna/index.json
```

It MUST NOT produce:

```
~/.kdna/domains/@aikdna/writing/KDNA_Core.json
~/.kdna/domains/@aikdna/writing/KDNA_Patterns.json
```

## Loading

A conforming runtime loads from the `.kdna` asset path recorded in `index.json` and verified by `receipt.json`. If a registry entry exists, the runtime or verifier MUST also reject yanked or revoked assets. It may read ZIP entries directly or extract to a hidden temporary directory for the duration of a command. Persistent extraction is not required and MUST NOT become the source of trust.
