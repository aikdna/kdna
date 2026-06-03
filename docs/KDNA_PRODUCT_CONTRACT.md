# KDNA Product Contract v1.0

> **Status:** Draft · 2026-05-26
> **Audience:** KDNAChat, KDNA Studio developers; domain authors; agent integrators
> **Goal:** Every KDNA product MUST conform to this contract. No product defines its own data structures.

## Purpose

KDNAChat and KDNA Studio share one core object: the KDNA domain. Without a unified contract, they will diverge and the ecosystem will fragment. This document defines the minimum data structures all products must agree on.

## 1. KDNA Asset Format

All products MUST support `.kdna` as the canonical domain asset. The internal asset tree is:

```
domain-name.kdna
  kdna.json              # Manifest (see below)
  KDNA_Core.json          # Axioms, ontology, frameworks, stances, risk_model, trigger_signals
  KDNA_Patterns.json      # Terminology, banned_terms, misunderstandings, self_check
  KDNA_Scenarios.json     # Optional: scenario-specific patterns
  KDNA_Cases.json         # Optional: real-world cases
  KDNA_Reasoning.json     # Optional: reasoning chains
  KDNA_Evolution.json     # Optional: evolution layers, growth stages
  locales/                # Optional: i18n (en/, zh-CN/, etc.)
  evals/                  # Optional: eval cases
  README.md               # Required: human-readable domain description
  LICENSE                 # Required: license file
```

Products MUST NOT treat extracted directories as installed runtime domains. Source directories are dev workspaces only.

### Manifest (kdna.json) — Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `format` | string | Canonical format marker: `"kdna"` |
| `format_version` | string | Container manifest version: `"1.0"` |
| `spec_version` | string | Canonical spec version (e.g., "1.0-rc") |
| `name` | string | `@scope/name` or bare name |
| `version` | string | SemVer |
| `description` | string | One-paragraph summary |
| `core_insight` | string | One sentence: what judgment this domain encodes |
| `author` | object | `{name, id, pubkey}` with ed25519 key |
| `license` | object | `{type}` (e.g., "CC-BY-4.0") |
| `status` | enum | `draft \| experimental \| beta \| stable \| deprecated` |
| `quality_badge` | enum | `untested \| tested \| validated \| expert_reviewed \| production_ready` |
| `risk_level` | enum | `R0 \| R1 \| R2 \| R3` |
| `signature` | string | ed25519 signature of the domain content |

## 2. Cluster Format

Clusters group multiple domains with composition rules:

```json
{
  "name": "cluster-name",
  "version": "x.y.z",
  "domains": ["domain_a", "domain_b"],
  "composition_rules": [
    {"task": "description", "load": ["domain_a", "domain_b"]}
  ],
  "conflict_resolution": ["priority rule 1", "priority rule 2"]
}
```

## 3. Judgment Trace Format

Every product that executes KDNA judgment MUST produce traces in this format:

```json
{
  "trace_id": "uuid",
  "domain_id": "writing",
  "domain_version": "0.2.0",
  "mode": "enforce | precheck | off",
  "timestamp": "ISO8601",
  "agent": "kdnachat | kdnawork | kdna-cli | kdnastudio",
  "input_summary": "first 200 chars of user input",
  "signals_detected": ["writing", "copy"],
  "axioms_triggered": ["axiom_1"],
  "patterns_matched": ["mis_1"],
  "misunderstandings_avoided": ["A hook is an emotional opening"],
  "violations_blocked": ["leverage"],
  "judgment_delta": {
    "without_kdna": "summary of response without KDNA",
    "with_kdna": "summary of response with KDNA",
    "difference": "key judgment differences"
  },
  "confidence": 0.82,
  "limitations": ["Not tested for technical docs"],
  "self_checks_passed": 3,
  "self_checks_failed": 0
}
```

## 4. Compare Result Format

When comparing responses with/without KDNA:

```json
{
  "domain_id": "writing",
  "input": "original user input",
  "without_kdna": {"response": "...", "violations": 3, "misunderstandings": 1},
  "with_kdna": {"response": "...", "violations": 0, "misunderstandings": 0},
  "delta": {
    "violations_avoided": 3,
    "misunderstandings_corrected": 1,
    "self_check_improvement": 2,
    "banned_terms_avoided": ["leverage", "synergy", "circle back"]
  }
}
```

## 5. Feedback Event Format

When a user provides feedback on a KDNA judgment:

```json
{
  "event_id": "uuid",
  "source": "kdnachat | kdnawork",
  "domain_id": "writing",
  "trace_id": "uuid of judgment trace",
  "user_feedback": {
    "type": "missed_judgment | false_positive | axiom_not_triggered | quality_concern",
    "comment": "free text",
    "rating": 1-5
  },
  "suggested_action": "create_eval_case | review_axiom | update_banned_terms | none",
  "timestamp": "ISO8601"
}
```

## 6. Human Lock Format

When a human confirms/locks a domain card:

```json
{
  "card_id": "axiom_1",
  "locked_by": "author_id",
  "locked_at": "ISO8601",
  "feynman_restatement": "human's own words restating the judgment",
  "feynman_score": 4.5,
  "verification_confirmations": [
    "I confirm this judgment reflects real expertise",
    "I confirm the applies_when / does_not_apply_when are accurate",
    "I confirm the failure_risk is honestly stated"
  ]
}
```

## 7. Registry Metadata Format

When a domain is indexed in the registry:

```json
{
  "name": "@aikdna/writing",
  "version": "0.7.2",
  "asset_url": "https://github.com/aikdna/kdna-writing/releases/download/v0.7.2/writing-0.7.2.kdna",
  "asset_digest": "sha256:<hex>",
  "signature": "ed25519:hex",
  "quality_badge": "tested",
  "risk_level": "R0",
  "review_status": "community",
  "known_limitations_url": "https://...",
  "human_lock_summary": {"locked_axioms": 3},
  "i18n_level": "L2",
  "languages": ["en", "zh-CN"]
}
```

## 8. Local Storage Path (~/.kdna)

All products MUST use the same local directory structure:

```
~/.kdna/
  config.json           # Global KDNA config
  identity/             # Author identity keys
  packages/             # Immutable installed .kdna assets
    @scope/name/version/name.kdna
  index.json            # Installed asset index
  licenses/             # Local activation records, not decrypted content
  clusters/             # Cluster manifests
  registry/             # Local registry cache
  traces/               # Judgment traces
  feedback/             # Feedback events
  evals/                # Eval cases
  cache/                # Rebuildable runtime cache; never a trust source
  licenses/             # Enterprise license files
```

## Conformance

Products MUST:
1. Read/write domains in the canonical package format
2. Produce judgment traces in the trace format
3. Use `~/.kdna/` for local storage
4. Accept and produce feedback events

Products SHOULD:
1. Validate domains against the canonical manifest schema before loading
2. Sign exported domains with ed25519
3. Verify signatures on imported domains
