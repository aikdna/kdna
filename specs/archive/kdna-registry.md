# KDNA Registry Specification

HISTORICAL / ARCHIVED DOCUMENT.

This document does not represent the current KDNA Core v1 positioning.
KDNA Core v1 is the official KDNA judgment-asset format and runtime loading
contract. KDNA Core v1 does not define a public registry, marketplace,
recommendation system, content ranking, official quality badge, or
certification program. This file is preserved for traceability of the
pre-v1 approach.


Version: 0.2
Status: Draft

## 1. Purpose

The KDNA Registry is the discovery and distribution layer for KDNA domain
packages. It is analogous to npm for JavaScript, PyPI for Python, or
Hugging Face Hub for ML models — but optimized for KDNA domain judgment assets.

## 2. Registry Architecture

```
┌──────────────────────────────────────────────────┐
│                  kdna CLI                         │
│  kdna install writing                               │
│  kdna search "writing"                            │
│  kdna publish ./dist/my-domain.kdna               │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              Registry API                          │
│  GET  /v1/domains                                 │
│  GET  /v1/domains/:id                             │
│  GET  /v1/domains/:id/versions/:version           │
│  POST /v1/domains                                 │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│           Registry Index                           │
│  domains.json (machine-readable index)             │
│  domain assets (GitHub repos / tarballs)         │
└──────────────────────────────────────────────────┘
```

## 3. Registry Index Format

The registry is defined by an index file (`domains.json`) that lists all
registered KDNA domains.

### Schema

```json
{
  "registry_version": "1.0-rc",
  "updated": "2026-05-17T10:00:00Z",
  "domains": [
    {
      "name": "@aikdna/writing",
      "version": "0.1.0",
      "repo": "https://github.com/aikdna/kdna-writing",
      "spec_version": "1.0-rc",
      "status": "experimental",
      "access": "public",
      "default_language": "en",
      "languages": ["en"],
      "author": {
        "name": "Zhang Ling",
        "id": "zhangling"
      },
      "license": {
        "type": "CC-BY-4.0"
      },
      "keywords": ["writing", "trust", "b2b"],
      "description": "Domain cognition for high-trust writing judgment.",
      "core_insight": "Price objections are certainty deficits, not price problems.",
      "file_count": 6,
      "created": "2026-05-13",
      "updated": "2026-05-17"
    }
  ]
}
```

### Domain Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique domain identifier. Lowercase snake_case. |
| `name` | Yes | Human-readable domain name. |
| `version` | Yes | Latest semantic version. |
| `repo` | Yes | Source repository URL. |
| `spec_version` | Yes | KDNA spec version the domain conforms to. |
| `status` | Yes | Maturity: `draft`, `experimental`, `stable`, `deprecated`, `staging`. |
| `access` | Yes | Access mode: `public`, `licensed`, `remote`. |
| `language` | Yes | Array of language codes. |
| `author` | Yes | Creator identity. |
| `license` | Yes | License information. |
| `keywords` | No | Search keywords. |
| `description` | Yes | One-sentence description. |
| `core_insight` | Yes | The domain's core judgment insight. |
| `file_count` | No | Number of KDNA JSON files in the domain. |
| `created` | No | Creation date. |
| `updated` | No | Last update date. |
| `asset_url` | Yes | Direct download URL for the canonical `.kdna` asset. |
| `asset_digest` | Yes | Whole-file digest for the canonical `.kdna` asset. |
| `signature` | No | Creator's cryptographic signature. |
| `dependencies` | No | Array of KDNA domain IDs this domain depends on. |
| `eval_score` | No | Current evaluation score (0-100). |
| `test_count` | No | Number of test cases in evaluation. |
| `quality_badge` | No | Current quality level: `untested`, `tested`, `validated`, `expert_reviewed`, `production_ready`. |
| `license_policy` | No | License enforcement policy for `access: licensed` domains. |
| `evaluation_history` | No | Array of historical evaluation records (see Section 3.1). |

### 3.1 License Policy

When `access` is `licensed`, the registry entry MAY include a `license_policy`
object that tells runtimes how to enforce the license:

```json
{
  "license_policy": {
    "activation": "local_license",
    "offline_grace_days": 7,
    "revocation_check": "registry_or_license_server",
    "machine_binding": "optional",
    "max_activations": 3
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `activation` | Yes | How the license is activated: `local_license`, `entitlement_api`, `hardware_dongle`. |
| `offline_grace_days` | No | Days a validated license can work offline before requiring re-sync. |
| `revocation_check` | No | Where to check revocation: `registry`, `license_server`, `registry_or_license_server`, `none`. |
| `machine_binding` | No | Whether the license is bound to a machine: `required`, `optional`, `none`. |
| `max_activations` | No | Maximum number of simultaneous activations allowed. |

### 3.2 Evaluation History

The `evaluation_history` array tracks how a domain's judgment quality changes over time. Each entry represents a benchmark run:

```json
{
  "evaluation_history": [
    {
      "version": "0.4.0",
      "eval_score": 96.7,
      "test_count": 30,
      "benchmark_id": "decision-state-benchmark-v2",
      "evaluated_at": "2026-05-19T00:00:00Z",
      "metrics": {
        "state_accuracy": 96.7,
        "false_actionization_errors": 0,
        "full_score_rate": 56.7,
        "scenarios_count": 30,
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `version` | Yes | Domain version evaluated. |
| `eval_score` | Yes | Overall score (0-100). |
| `test_count` | Yes | Number of scenarios tested. |
| `benchmark_id` | Yes | Identifier of the benchmark used. |
| `evaluated_at` | Yes | ISO 8601 timestamp. |
| `metrics` | No | Additional benchmark-specific metrics. |

**Purpose**: Evaluation history enables:
1. **Regression detection** — Did a version change improve or degrade judgment?
2. **Reproducibility** — Which benchmark, when, with what model?
3. **Comparability** — Compare domains using the same benchmark.

## 4. Local Registry

For offline development and testing, the KDNA toolchain supports a local registry
file. The default location is:

```
~/.kdna/registry/domains.json
```

Project-level registries can override the global registry:

```
<project>/.kdna/registry/domains.json
```

The CLI searches in order:
1. Project-level `.kdna/registry/domains.json`
2. User-level `~/.kdna/registry/domains.json`
3. Remote registry `https://registry.aikdna.com/v1/domains`

## 5. Discovery Protocol

### 5.1 Search

```bash
kdna search "writing"
kdna search "writing"
kdna search --status stable
kdna search --language zh-CN
```

### 5.2 Info

```bash
kdna info writing
```

Output:
```
Name:        Sales KDNA
ID:          writing
Version:     0.1.0
Status:      experimental
Access:      open
Language:    en
Author:      Zhang Ling (zhangling)
License:     CC-BY-4.0
Description: Domain cognition for high-trust writing judgment.
Core:        Price objections are certainty deficits, not price problems.
Files:       6 (KDNA_Core, KDNA_Patterns, Scenarios, Cases, Reasoning, Evolution)
Repo:        https://github.com/aikdna/kdna-writing
```

### 5.3 List

```bash
kdna list              # List installed domains
kdna list --available  # List all available domains from registry
kdna list --outdated   # List domains with available updates
```

## 6. Installation Protocol

```bash
kdna install writing
kdna install writing@0.1.0
kdna install @aikdna/writing
kdna install https://example.com/writing-0.1.0.kdna
kdna install ./writing-0.1.0.kdna
```

### Installation Store

Installed assets are stored as immutable `.kdna` files:

```
~/.kdna/packages/@scope/name/<version>/<name>-<version>.kdna
~/.kdna/packages/@scope/name/<version>/receipt.json
~/.kdna/index.json
```

The internal domain tree is not the installed object. Any extraction cache is hidden, rebuildable, and not a trust source.

### Asset Resolution Order

When an Agent loads a KDNA asset, it resolves:

1. Explicit local `.kdna` file path
2. Installed package index entry in `~/.kdna/index.json`
3. Registry entry for install / update / trust verification

## 7. Publishing Protocol (Future)

```bash
kdna publish ./dist/my-domain.kdna
kdna publish --dry-run ./dist/my-domain.kdna
```

Pre-publish checks:
1. Asset passes `kdna verify`
2. `kdna.json` manifest is complete and includes authoring provenance for trusted quality claims
3. Repository URL is valid
4. Version is not already published
5. License is declared

## 8. Registry Security

### Package Integrity

- Every canonical `.kdna` asset MUST publish an `asset_digest` in the registry.
- The CLI MUST verify `asset_digest` after download.
- Signed assets SHOULD have a creator signature verified against the scope public key.

### Trust Levels

| Level | Criteria | Badge |
|-------|----------|-------|
| Official | Maintained by the KDNA core team | scope type `official` |
| Verified | Signature and provenance verified | review status `verified` |
| Community | Submitted by community members | review status `community` |
| Untested | Schema validation only | `untested` |
| Tested | >= 10 manually verified eval cases | `tested` |
| Validated | >= 30 eval cases + benchmark report + raw outputs | `validated` |
| Expert Reviewed | Validated evidence + external expert review | `expert_reviewed` |
| Production Ready | Expert-reviewed + deployment evidence | `production_ready` |

### Future: DID-Based Verification

```
{
  "author": {
    "name": "Zhang Ling",
    "id": "did:kdna:creator:zhangling"
  },
  "signature": "0x..."
}
```

## 9. Static Registry (Immediate)

For the immediate roadmap, the registry will remain a simple static JSON file.
This avoids infrastructure complexity while proving the installation workflow.

```
kdna-registry/
├── domains.json
├── README.md
└── packages/
    ├── writing-0.1.0.kdna
    ├── management-0.1.0.kdna
    └── communication-0.1.0.kdna
```

The CLI reads `domains.json` to resolve domain IDs to download URLs.
Download URLs point to GitHub release assets or the registry's `packages/` directory.

## 10. CLI Commands

```bash
kdna install <domain>        # Install a domain from registry
kdna uninstall <domain>      # Remove an installed domain
kdna search <query>          # Search the registry
kdna list                    # List installed domains
kdna list --available        # List all available domains
kdna info <domain>           # Show domain details
kdna update <domain>         # Update to latest version
kdna update                  # Update all installed domains
```

## 11. GitHub Organization Integration

Domains published under the `aikdna` GitHub organization are automatically
discoverable. The registry index is generated from:

1. Repository topics: `kdna-domain`, `kdna-open`, `kdna-basic`
2. Repository's `kdna.json` at the root of the default branch
3. GitHub release assets (`.kdna` files)

A CI workflow in `kdna-registry` periodically regenerates `domains.json` by
scanning all `kdna-*` repos in the organization.
