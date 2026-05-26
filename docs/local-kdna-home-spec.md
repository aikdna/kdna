# ~/.kdna Directory Specification v1.0

> **Status:** Draft · 2026-05-26
> **Applies to:** kdna-cli, KDNAChat, KDNaStudio, KDNAWork

## Purpose

Define the canonical local directory structure for all KDNA products. Every product MUST use `~/.kdna/` as its local KDNA home. Products that store KDNA data elsewhere break ecosystem interoperability.

## Directory Structure

```
~/.kdna/
│
├── config.json                  # Global configuration
│
├── identity/                    # Author/developer identity
│   ├── keypair.json             # ed25519 keypair (private key)
│   └── pubkey.json              # Public key only (for sharing)
│
├── domains/                     # All installed domains
│   ├── official/                # From KDNA Registry (npm install)
│   │   └── @aikdna/
│   │       ├── writing/
│   │       ├── code_review/
│   │       └── ...
│   ├── local/                   # User-created (Studio output)
│   │   └── my_domain/
│   └── private/                 # Enterprise/team private domains
│       └── company_domain/
│
├── clusters/                    # Cluster manifests
│   └── animation.json
│
├── registry/                    # Local registry cache
│   ├── cache.json               # Cached domains.json
│   └── manifests/               # Individual domain manifests
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
├── cache/                       # Runtime cache (temporary)
│   └── ...
│
└── licenses/                    # Enterprise/pro license files
    └── <license_id>.lic
```

## config.json Format

```json
{
  "version": "1.0",
  "default_author": "local",
  "registry_url": "https://raw.githubusercontent.com/aikdna/kdna-registry/main/domains.json",
  "preferred_language": "en",
  "agent": "kdnachat",
  "trace_enabled": true,
  "feedback_enabled": true,
  "auto_update_registry": true
}
```

## Product Responsibilities

| Product | Reads from | Writes to |
|---------|-----------|-----------|
| kdna-cli | `domains/`, `clusters/`, `registry/` | `domains/official/`, `identity/`, `licenses/` |
| KDNAChat | `domains/`, `identity/`, `config.json` | `traces/`, `feedback/` |
| KDNaStudio | `domains/local/`, `identity/` | `domains/local/`, `identity/` |
| KDNAWork | `domains/`, `traces/`, `config.json` | `traces/`, `feedback/`, `domains/private/` |

## Migration Path

### Current State (2026-05-26)
- KDNAChat reads domains from `~/.kdna/domains/` (flat)
- KDNAWork manages its own workspace-local storage
- KDNaStudio reads/writes to project-local paths
- kdna-cli installs to `~/.agents/Kdna/`

### Target State (Phase 1-B)
- All products use the structure above
- kdna-cli `install` writes to `domains/official/`
- KDNaStudio creates in `domains/local/` by default
- KDNAChat loads from `domains/official/` and `domains/local/`
- KDNAWork syncs `domains/private/` for team use
