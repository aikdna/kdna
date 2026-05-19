# .kdna File Format Specification

Version: 0.2
Status: Draft

## 1. Purpose

`.kdna` is the single-file human-readable format for a KDNA domain cognition asset.
It bundles all required and optional KDNA sections into one self-contained file
that can be read by both humans and AI agent loaders.

## 2. File Extension

```
.kdna
```

Example: `writing-basic.kdna`, `sales-pro.kdna`

## 3. Format

`.kdna` files use **subset of YAML 1.2** (preferred) or **JSON**. YAML is recommended
because it is more human-readable and supports multi-line strings naturally.

The file MUST be valid YAML 1.2 or valid JSON. Mixed formats are not allowed.

Encoding MUST be UTF-8.

## 4. Top-Level Structure

```yaml
kdna_spec: "0.4"

meta:
  name: "sales"
  version: "1.0.0"
  language: "en"
  spec_version: "0.4"
  created: "2026-05-17"
  description: "Domain cognition for high-trust sales."
  access: "open"

author:
  name: "Zhang Ling"
  id: "zhangling"

license:
  type: "CC-BY-4.0"
  url: "https://creativecommons.org/licenses/by/4.0/"

core:
  axioms: []
  ontology: []
  frameworks: []
  core_structure: []
  stances: []

patterns:
  terminology:
    preferred_terms: []
    banned_terms: []
  misunderstandings: []
  self_check: []

scenarios:     # optional
  scenes: []

cases:         # optional
  cases: []

reasoning:     # optional
  reasoning_chains: []

evolution:     # optional
  stages: []
  evolution_layers: []
  measurement: []
```

## 5. Top-Level Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kdna_spec` | Yes | The `.kdna` format spec version. MUST be `"0.4"` for this draft. |
| `meta` | Yes | Domain metadata (see section 6). |
| `author` | Yes | Creator identity (see section 7). |
| `license` | Yes | License declaration (see section 8). |
| `core` | Yes | Core cognition (axioms, ontology, frameworks, structure, stances). |
| `patterns` | Yes | Language boundaries and self-checks. |
| `scenarios` | No | Scene-based action orientation. |
| `cases` | No | Complete case examples. |
| `reasoning` | No | Reasoning chains and why explanations. |
| `evolution` | No | Practice stages, capability layers, measurement. |

A valid minimal `.kdna` file MUST include `core.axioms`, `core.stances`,
`patterns.terminology`, and `patterns.self_check` with at least one entry each.

## 6. Meta Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Domain identifier. Lowercase snake_case matching `^[a-z][a-z0-9_]*$`. |
| `version` | Yes | Semantic version of this KDNA (e.g. `"1.0.0"`). |
| `language` | Yes | Primary language code (e.g. `"en"`, `"zh-CN"`, `"ja"`). |
| `spec_version` | Yes | The KDNA spec version this file conforms to (`"0.4"`). |
| `created` | Yes | Creation date in ISO 8601 format (`YYYY-MM-DD`). |
| `description` | Yes | One-sentence description of the domain. |
| `access` | Yes | Access mode: `"open"`, `"licensed"`, or `"runtime"`. See `kdna-access-modes.md`. |

## 7. Author Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the creator. |
| `id` | Yes | Unique creator identifier (e.g. `"zhangling"`, `"did:kdna:creator:zhangling"`). |
| `url` | No | Creator's homepage or profile URL. |
| `email` | No | Contact email. |

## 8. License Fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | SPDX license identifier or KDNA license type. See `kdna-license.md`. |
| `url` | No | URL to full license text. |
| `allow_agent_use` | No | Boolean. Whether AI agents may load and use this KDNA. Default: `true`. |
| `allow_redistribution` | No | Boolean. Whether this KDNA may be redistributed. Default: depends on license. |
| `allow_training` | No | Boolean. Whether this KDNA may be used for model training. Default: `false`. |

## 9. Core Fields

The `core` section mirrors the existing `KDNA_Core.json` structure.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `axioms` | Yes | Array | Core judgment principles. Each: `id`, `one_sentence`, `full_statement`, `why`. |
| `ontology` | Yes | Array | Key domain concepts. Each: `id`, `one_sentence`, `essence`, `boundary`, `trigger_signal`. |
| `frameworks` | Yes | Array | Diagnostic frameworks. Each: `id`, `name`, `when_to_use`, `steps`. |
| `core_structure` | Yes | Array | Causal movement: `from` → `to` via `via`. |
| `stances` | Yes | Array | Domain default positions. Each: `id`, `stance`, `anti_stance`. |

## 10. Patterns Fields

The `patterns` section mirrors the existing `KDNA_Patterns.json` structure.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `terminology.preferred_terms` | Yes | Array | Domain-specific preferred terms. Each: `term`, `definition`. |
| `terminology.banned_terms` | Yes | Array | Terms to avoid. Each: `term`, `why`, `replace_with`. |
| `misunderstandings` | Yes | Array | Common wrong interpretations. Each: `id`, `wrong`, `correct`, `key_distinction`, `why`. |
| `self_check` | Yes | Array | Yes/no answerable questions. Each: `id`, `question`. |

## 11. Optional Section Fields

The `scenarios`, `cases`, `reasoning`, and `evolution` sections mirror the
existing optional KDNA JSON files. See SPEC.md for full field definitions.

## 12. Minimal Valid Example

```yaml
kdna_spec: "0.4"
meta:
  name: "writing_basic"
  version: "1.0.0"
  language: "en"
  spec_version: "0.4"
  created: "2026-05-17"
  description: "Basic cognition for writing judgment."
  access: "open"

author:
  name: "Zhang Ling"
  id: "zhangling"

license:
  type: "CC-BY-4.0"
  url: "https://creativecommons.org/licenses/by/4.0/"
  allow_agent_use: true
  allow_training: false

core:
  axioms:
    - id: "AX-001"
      one_sentence: "Clarity is the writer's only obligation."
      full_statement: "Every sentence must move the reader's understanding forward. If it does not, cut it."
      why: "Without this priority, writing becomes self-expression instead of communication."
  ontology:
    - id: "reader_model"
      one_sentence: "The imagined reader the writer is addressing."
      essence: "A specific person with specific knowledge, concerns, and attention span."
      boundary: "Not a generic 'audience' or 'everyone'."
      trigger_signal: "Writer uses 'we all know' or references unclear context."
  frameworks:
    - id: "FW-001"
      name: "Inversion Check"
      when_to_use: "When a sentence feels unclear."
      steps:
        - "Identify the sentence."
        - "Ask: what if the reader believes the opposite?"
        - "If confusion is possible, rewrite until unambiguous."
  core_structure:
    - from: "Vague idea"
      to: "Reader understanding"
      via: "Specific, testable sentences"
  stances:
    - id: "ST-001"
      stance: "Writing exists to transfer understanding, not to impress."
      anti_stance: "Writing exists to showcase vocabulary or intelligence."

patterns:
  terminology:
    preferred_terms:
      - term: "reader"
        definition: "The specific person who will consume this text."
    banned_terms:
      - term: "obviously"
        why: "If something is obvious, stating it insults the reader. If it is not obvious, stating this is dishonest."
        replace_with: "Remove the word and let the facts speak."
  misunderstandings:
    - id: "MS-001"
      wrong: "Good writing requires complex vocabulary."
      correct: "Good writing uses the simplest word that carries the precise meaning."
      key_distinction: "Complexity of vocabulary vs. precision of vocabulary."
      why: "Prioritizing complexity over precision produces writing that is impressive but unclear."
  self_check:
    - id: "SC-001"
      question: "Can each sentence be clearly understood by the intended reader?"
```

## 13. Relationship to .kdnapack

- `.kdna` is a single-file, human-readable format suitable for open-source and public sharing.
- `.kdnapack` is a multi-file package format suitable for complex domains with many cases,
  scenarios, or localized content. See `kdna-package-format.md`.

A `.kdna` file can be converted to a `.kdnapack` directory using `kdna unpack`.
A `.kdnapack` directory can be converted to a `.kdna` file using `kdna pack --single`.

## 14. Extension Registration

The `.kdna` file extension SHOULD be registered as:

- **MIME type:** `application/x-kdna` (provisional), `application/kdna+yaml` (preferred)
- **File type:** text, UTF-8, YAML or JSON
- **Magic bytes (YAML):** starts with `kdna_spec:` at byte 0
- **Magic bytes (JSON):** starts with `{"kdna_spec":` at byte 0 (after optional whitespace)
