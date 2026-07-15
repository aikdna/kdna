# KDNA Asset Card Specification

> Draft release-card concept. Current public examples should use `.kdna` files
> plus release cards as descriptive evidence; this file does not define a
> registry listing, marketplace listing, or official certification system.

Version: 0.1
Status: Draft
Canonical: `KDNA/specs/kdna-asset-card.md`

## 1. Purpose

A KDNA Asset Card is the discoverable, shareable, and evaluable representation of a KDNA domain judgment package. It serves the same role for KDNA assets that an app store listing serves for apps, a book cover serves for books, or a package page serves for npm/PyPI — but optimized for judgment assets.

Every KDNA domain, whether open or commercial, MUST have an Asset Card before it can be:
- Listed in the registry
- Installed by users
- Reviewed for quality badge promotion
- Offered as a commercial product

## 2. Asset Card Schema

```json
{
  "asset_id": "@scope/domain-name",
  "asset_version": "1.0.0",
  "asset_type": "domain",

  "creator": {
    "name": "Creator or Organization Name",
    "id": "creator-identity",
    "profile_url": "https://aikdna.com/creators/creator-identity",
    "verified": true,
    "bio": "One-sentence creator background.",
    "pubkey": "ed25519:<hex>"
  },

  "audience": {
    "who_should_use": "Description of ideal user persona.",
    "who_should_not_use": "Description of user who would be misled.",
    "prerequisites": ["domain knowledge prerequisites"],
    "agent_compatibility": ["Claude Code", "OpenCode", "Codex"]
  },

  "judgment_style": {
    "summary": "One-sentence description of what this domain judges.",
    "tone": "authoritative | collaborative | advisory | diagnostic | aesthetic",
    "strengths": ["What this domain judges exceptionally well."],
    "limitations": ["What this domain does NOT judge well."],
    "sample_inputs": [
      {
        "scenario": "Brief scenario description.",
        "without_kdna": "What a model typically does without this domain.",
        "with_kdna": "What the model does with this domain loaded."
      }
    ]
  },

  "license": {
    "type": "CC-BY-4.0 | KCL-1.0 | ...",
    "url": "https://aikdna.com/licenses/KCL-1.0",
    "commercial": false,
    "allow_agent_use": true,
    "allow_redistribution": false,
    "allow_training": false
  },

  "subscription": {
    "model": "free | one_time | subscription | enterprise | runtime_api",
    "price": "Free | $X/seat/month | Custom pricing",
    "billing_period": null,
    "trial_available": false,
    "trial_duration_days": null,
    "includes_updates": true,
    "update_cadence": "monthly | quarterly | on_revision"
  },

  "update_policy": {
    "versioning": "Semantic versioning. Judgment changes increment judgment_version.",
    "changelog_url": "https://github.com/aikdna/kdna-domain/CHANGELOG.md",
    "deprecation_notice_days": 90,
    "breaking_change_policy": "Major judgment changes ship as new major version with migration guide."
  },

  "evidence": {
    "quality_badge": "untested | tested | validated | expert_reviewed | production_ready",
    "eval_score": 96.7,
    "test_count": 30,
    "benchmark_count": 2,
    "latest_benchmark_id": "kdna.benchmark.decision-state",
    "latest_benchmark_date": "2026-05-19",
    "comparison_report_url": "https://github.com/aikdna/kdna/blob/main/benchmarks/decision-state-comparison-report.md",
    "raw_outputs_url": "https://github.com/aikdna/kdna/tree/main/benchmarks/raw",
    "failure_cases_published": true,
    "model_versions_tested": ["claude-3-5-sonnet-20241022", "kimi-for-coding"],
    "evaluation_history": []
  },

  "technical": {
    "kdna_version": "1.0",
    "judgment_version": "2026.05",
    "file_count": 6,
    "languages": ["en", "zh-CN"],
    "default_language": "en",
    "i18n_level": "L2",
    "risk_level": "R1",
    "signature": "ed25519:<hex>",
    "asset_digest": "sha256:<64-hex>",
    "asset_url": "https://github.com/aikdna/kdna-domain/releases/download/0.7.5/domain.kdna",
    "repo": "https://github.com/aikdna/kdna-domain",
    "runtime_endpoint": null,
    "access_mode": "public | licensed | remote"
  },

  "support": {
    "contact": "security@aikdna.com",
    "response_time": "48 hours",
    "community_forum": null,
    "refund_policy": "7-day refund for commercial assets if not satisfied"
  }
}
```

## 3. Field Reference

### 3.1 Creator Block

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the creator or organization. |
| `id` | Yes | Unique identity string. |
| `profile_url` | No | URL to creator profile page on registry/marketplace. |
| `verified` | No | Whether the creator identity has been verified. |
| `bio` | No | One-sentence description of the creator's expertise. |
| `pubkey` | Yes (commercial) | ed25519 public key for signature verification. |

### 3.2 Audience Block

| Field | Required | Description |
|-------|----------|-------------|
| `who_should_use` | Yes | Clear description of the ideal user persona. |
| `who_should_not_use` | Yes | Explicit statement of who would be misled by this domain. |
| `prerequisites` | No | Knowledge or context the user should have. |
| `agent_compatibility` | No | List of agents this domain has been tested with. |

### 3.3 Judgment Style Block

| Field | Required | Description |
|-------|----------|-------------|
| `summary` | Yes | One-sentence description of what the domain judges. |
| `tone` | Yes | Judgment tone: authoritative, collaborative, advisory, diagnostic, aesthetic. |
| `strengths` | Yes | What this domain judges exceptionally well. |
| `limitations` | Yes | What this domain does NOT judge well. |
| `sample_inputs` | Yes | At least 2 before/after examples demonstrating judgment change. |

### 3.4 License Block

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | License identifier (see kdna-license.md). |
| `url` | Yes (for KCL) | Canonical license URL. |
| `commercial` | Yes | Whether this is a commercial (paid) asset. |
| `allow_agent_use` | Yes | Whether agents may load and apply this domain. |
| `allow_redistribution` | Yes | Whether the asset may be redistributed. |
| `allow_training` | Yes | Whether content may be used for model training. |

### 3.5 Subscription Block (Commercial Only)

| Field | Required | Description |
|-------|----------|-------------|
| `model` | Yes (commercial) | free, one_time, subscription, enterprise, runtime_api. |
| `price` | Yes (commercial) | Human-readable price string. |
| `billing_period` | No | monthly, annual. |
| `trial_available` | No | Whether a free trial is offered. |
| `trial_duration_days` | No | Trial length in days. |
| `includes_updates` | Yes (commercial) | Whether updates are included in the price. |
| `update_cadence` | No | Expected update frequency. |

### 3.6 Update Policy Block

| Field | Required | Description |
|-------|----------|-------------|
| `versioning` | Yes | Description of versioning scheme. |
| `changelog_url` | No | URL to public changelog. |
| `deprecation_notice_days` | No | Days of notice before deprecation. |
| `breaking_change_policy` | No | How breaking changes are communicated and migrated. |

### 3.7 Evidence Block

| Field | Required | Description |
|-------|----------|-------------|
| `quality_badge` | Yes | Current quality badge level. |
| `eval_score` | No | Latest evaluation score (0-100). |
| `test_count` | No | Number of test cases. |
| `benchmark_count` | No | Number of benchmarks run. |
| `latest_benchmark_id` | No | Identifier of the most recent benchmark. |
| `latest_benchmark_date` | No | Date of the most recent benchmark. |
| `comparison_report_url` | No | URL to the comparison report. |
| `raw_outputs_url` | No | URL to raw model outputs. |
| `failure_cases_published` | No | Whether failure cases are publicly accessible. |
| `model_versions_tested` | No | Models used in benchmarking. |
| `evaluation_history` | No | Historical evaluation records. Registry usage of this field is out of scope for KDNA Core. |

### 3.8 Technical Block

| Field | Required | Description |
|-------|----------|-------------|
| `kdna_version` | Yes | KDNA Asset Container wire value reported by the asset. |
| `judgment_version` | No | YYYY.MM version tracking judgment revisions. |
| `file_count` | No | Number of KDNA JSON files. |
| `languages` | Yes | Supported BCP 47 language tags. |
| `default_language` | Yes | Primary judgment language. |
| `i18n_level` | No | Localization coverage level (L1/L2/L3). |
| `risk_level` | Yes | R0 (safe) to R3 (high-risk). |
| `signature` | Yes (commercial) | Cryptographic signature. |
| `asset_digest` | Yes (installable) | Whole-file `.kdna` asset digest. |
| `asset_url` | Yes (installable) | Direct `.kdna` asset download URL. |
| `repo` | Yes | Source repository URL. |
| `runtime_endpoint` | No | Runtime API endpoint (for runtime-mode domains). |
| `access_mode` | Yes | public, licensed, or remote. |

### 3.9 Support Block

| Field | Required | Description |
|-------|----------|-------------|
| `contact` | Yes | Support contact method. |
| `response_time` | No | Expected response time. |
| `community_forum` | No | Community support URL. |
| `refund_policy` | No | Refund terms (for commercial assets). |

## 4. Asset Card vs Registry Entry

The Asset Card is a **superset** of the registry entry. Every field in the registry `domains.json` entry also appears in the Asset Card. The Asset Card adds:

- Creator profile and expertise context
- Audience definition (who should/shouldn't use)
- Judgment style description with sample inputs
- Subscription pricing and update cadence
- Support and refund policy
- Richer evidence summary with comparison report links

## 5. Required vs Recommended Fields

### Required for All Assets
- `asset_id`, `asset_version`, `asset_type`
- `creator.name`, `creator.id`
- `audience.who_should_use`, `audience.who_should_not_use`
- `judgment_style.summary`, `judgment_style.tone`, `judgment_style.strengths`, `judgment_style.limitations`, `judgment_style.sample_inputs`
- `license.type`, `license.commercial`, `license.allow_agent_use`
- `technical.kdna_version`, `technical.languages`, `technical.default_language`, `technical.risk_level`, `technical.access_mode`, `technical.repo`
- `support.contact`

### Required for Commercial Assets (KCL-1.0 / licensed / remote)
- All required fields above, plus:
- `creator.pubkey`
- `license.url`
- `subscription.model`, `subscription.price`, `subscription.includes_updates`
- `technical.signature`
- `evidence.quality_badge` (minimum: `tested`)
- `evidence.test_count` (minimum: 10)

### Required for quality_badge >= validated
- `evidence.benchmark_count` >= 1
- `evidence.comparison_report_url`
- `evidence.raw_outputs_url`
- `evidence.failure_cases_published` = true

## 6. Asset Card Generation

Asset Cards are generated from:
1. `kdna.json` manifest (technical, license, author fields)
2. `KDNA_Core.json` (axioms, ontology, frameworks for judgment style)
3. `KDNA_Evolution.json` (evaluation history)
4. Registry entry (quality_badge, test_count, asset_digest, signature)
5. Creator-supplied content (audience, sample inputs, support policy)

The Studio Creator flow will guide creators through completing all Asset Card fields.
The CLI `kdna publish` will validate Asset Card completeness before accepting a publication.

## 7. Validation Rules

A conforming Asset Card validator MUST enforce:

1. All required fields (by access mode and quality badge level) are present and non-empty.
2. `access_mode` is one of `public`, `licensed`, `remote`.
3. For `licensed` or `remote` assets, `license.url` points to the canonical KCL-1.0 URL.
4. `quality_badge` is one of `untested`, `tested`, `validated`, `expert_reviewed`, `production_ready`.
5. `sample_inputs` array has at least 2 entries, each with `scenario`, `without_kdna`, and `with_kdna`.
6. `audience.who_should_not_use` is not empty — every asset must declare its non-audience.
7. `judgment_style.tone` is one of the valid tone values.
8. For `production_ready` badge: `test_count` >= 30 and `benchmark_count` >= 2.

---

*This specification is versioned independently. The canonical version lives at `KDNA/specs/kdna-asset-card.md` and is referenced by the registry SCHEMA.md and the Studio project schema.*
