# KDNA Enum Tables — Single Source of Truth

> Canonical enum values for all KDNA domain manifest fields.
> This document overrides any conflicting definitions in READMEs, wiki pages, or older specs.
> Linked from: `schema/kdna-manifest-v1rc.json`, `SPEC.md §3.3.2`.

---

## 1. status — Domain Maturity

| Value | Meaning |
|-------|---------|
| `draft` | Early work in progress. Structure may change. Not ready for external use. |
| `experimental` | Complete but not yet proven in practice. Ready for testing and feedback. |
| `stable` | Structure frozen, content mature. Safe for production use. |
| `deprecated` | Superseded by another domain. Must set `replaced_by`. |
| `staging` | Non-public pre-release. Used for pro/commercial domains before public launch. Not discoverable in default registry search. |

**Legacy values (retired):** `basic`, `pro`, `reference`

---

## 2. quality_badge — Evidence Level

| Value | Min Eval Cases | Automated Scoring | Description |
|-------|:---:|:---:|---|
| `untested` | 0 | N/A | Passes schema validation only. No judgment quality evidence. |
| `tested` | >= 3 | Manual verification | Has eval cases with manual verification. Requires `signature`. |
| `validated` | >= 10 | `kdna verify --judgment` passes | Automated scoring passes. Requires `signature`. |
| `expert_reviewed` | >= 10 | External expert sign-off | Reviewed by a domain expert. Requires `reviewed_by` and `signature`. |
| `production_ready` | >= 10 | Deployment metrics | Validated + real-world deployment evidence. Requires `signature`. |

**Legacy values (retired):** `unreleased`

---

## 3. access — Distribution Mode

| Value | Description |
|-------|-------------|
| `open` | Plaintext, freely available. Distributed as `.kdna` package. |
| `licensed` | Encrypted, requires local license. Distributed as `.kdnae` or `.kdnal` package. |
| `runtime` | Not distributed. Server-side API only. Highest security tier. |

---

## 4. risk_level — Risk Classification

| Value | Name | Load Behavior | Example Domains |
|-------|------|---------------|----------------|
| `R0` | Low | Load with no warning. | writing, content_strategy |
| `R1` | Medium-Low | Load with informational notice. | decision_state, product decisions |
| `R2` | Medium | Load with strong warning. Recommend certified domains. | agent_safety, code_review |
| `R3` | High | Load with mandatory warning. Require verified/reviewed badge. | security strategy, code execution |

---

## 5. i18n_level — Internationalization Maturity

| Value | Description |
|-------|-------------|
| `L0` | Single language only. No translation support. |
| `L1` | Basic translation of axioms and self-checks. |
| `L2` | Full bilingual support (en + zh-CN minimum). All judgment content translated. |
| `L3` | Multi-language with locale-aware content (scenarios, cases differ by locale). |

---

## 6. Field Naming Canon

### kdna_spec vs spec_version

| Context | Canonical Field | Deprecated |
|---------|----------------|------------|
| Domain package kdna.json (directory) | `kdna_spec: "1.0-rc"` | `spec_version` (remove from domain manifests) |
| .kdna container manifest (archive) | `spec_version: "1.0-rc"` | — |

**Rule:** Domain repos use `kdna_spec`. Container manifests use `spec_version`. They MUST NOT both appear in the same manifest.

### version vs judgment_version

| Field | Tracks | Format | Increment Trigger |
|-------|--------|--------|-------------------|
| `version` | Package/metadata changes | semver (MAJOR.MINOR.PATCH) | File reorg, manifest changes, README updates |
| `judgment_version` | Judgment content changes | YYYY.MM or semver | Axiom, ontology, misunderstanding, or self-check changes |

`version` and `judgment_version` are independent. A domain at `version: "0.7.2"` may have `judgment_version: "2026.05"`.

---

## 7. Fields Removed from Domain Manifest

These fields appeared in some domain kdna.json files but are NOT part of the canonical manifest:

| Field | Reason | Where It Belongs |
|-------|--------|-----------------|
| `domain_field` | Vague categorization, not standardized. | — (remove) |
| `judgment_patterns` | Vague categorization, not standardized. | — (remove) |
| `files` | Redundant with `file_count`. | — (remove) |
| `registry` | Registry-level metadata, not domain-level. | Registry `domains.json` |
| `release_status` | Registry-level field, not domain-level. | Registry `domains.json` |
| `commercial` (in license) | Redundant with `access` field. | — (remove from license object) |
| `allow_agent_use` (in license) | License-type-specific. Not universal. | KCL extension schema |
| `allow_redistribution` (in license) | License-type-specific. Not universal. | KCL extension schema |
| `allow_training` (in license) | License-type-specific. Not universal. | KCL extension schema |
