# KDNA Core Specification — 2026.07

**Status:** Current (GA)
**Format:** KDNA Asset — `.kdna` file, `application/vnd.kdna.asset`, CBOR-encoded
`payload.kdnab` (RFC 8949). See `packages/kdna-core/src/container/index.js` for the
reference packer and validator.

**Previous:** v0.4 (superseded)
**Editors:** KDNA Team
**Repository:** https://github.com/aikdna/kdna

## Abstract

KDNA (Knowledge DNA) is a structured asset format for encoding domain judgment for AI agents. A `.kdna` asset represents one scoped judgment domain; complex agent work MAY route and compose multiple `.kdna` assets into KDNA Clusters. This specification defines the `.kdna` asset format, internal file tree, validation rules, loading behavior, and conformance requirements for KDNA domains and their composition layer.

## Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

- **Domain:** A specific area of expertise with recurring judgment patterns (e.g., sales, management, code review).
- **KDNA Asset:** A `.kdna` file representing one portable, installable, verifiable, and loadable domain judgment asset. A valid KDNA asset MUST contain `payload.kdnab` (encoded judgment). It MUST NOT contain `KDNA_Core.json`, `KDNA_Patterns.json`, `KDNA_Scenarios.json`, `KDNA_Cases.json`, `KDNA_Reasoning.json`, or `KDNA_Evolution.json` as top-level ZIP entries. Those files belong to the source tree only.
- **Internal Domain Tree:** The content encoded inside `payload.kdnab`. This is not human-readable directly; consumption requires KDNA-compatible tooling. The source tree (KDNA_Core.json etc.) is the authoring format, never distributed as an asset.
- **Dev Source Directory:** An optional authoring workspace used to build a `.kdna` asset. Source directories are non-canonical and MUST NOT be treated as installed runtime domains.
- **Loader:** Software that reads KDNA files and formats them for agent consumption.
- **Validator:** Software that checks KDNA files for structural compliance.
- **Registry:** (Historical) A machine-readable index of KDNA domains. Not part of the current Core specification. See decisions/0003.

## 1. Scope

KDNA is designed for:
- AI agents that need stable domain judgment
- Domain experts packaging expertise for AI consumption
- Agent runtimes requiring structured context beyond raw documents
- Skill systems needing a judgment layer separate from execution steps

KDNA is NOT designed for:
- Storing large document collections
- Replacing RAG (Retrieval-Augmented Generation)
- Replacing tool APIs or MCP servers
- Procedural automation steps
- Generic prompt collections

## 1.5. Boundaries and Extension

KDNA is a *judgment structure format*, not a general content format. The following boundaries are defined to prevent format dilution.

**Critical distinction: Source Tree versus Distribution Asset.** The Source Tree
(`KDNA_Core.json`, `KDNA_Patterns.json`, etc.) is an authoring workspace. The
`.kdna` Distribution Asset contains `kdna.json` + `payload.kdnab` (CBOR-encoded judgment). Source-tree file
names below refer to the logical structure inside `payload.kdnab`, not to ZIP
entries in the distribution container. See
[Container Specification](specs/container.md) for the wire format.

**Invariant (MUST NOT change across versions):**
- A `.kdna` distribution asset MUST contain `kdna.json` + `payload.kdnab`. It MUST NOT contain `KDNA_Core.json`, `KDNA_Patterns.json`, or other source-tree JSON files as top-level ZIP entries.
- In the Source Tree, the minimum valid domain is `KDNA_Core.json` + `KDNA_Patterns.json`.
- Each file MUST contain a `meta` object with `version`, `domain`, `created`, `purpose`, `load_condition`
- Axioms MUST have `one_sentence`, `full_statement`, and `why`
- Misunderstandings MUST have `key_distinction`
- Self-checks MUST be answerable with yes/no
- Banned terms MUST have `why` and `replace_with`
- Reasoning chains MUST have `so_what`
- IDs MUST be unique within a domain
- Domain names and versions MUST be consistent across files

**Extension points (MAY be added by implementations):**
- Additional fields within existing objects (namespaced with `x_` prefix)
- Custom toolchain metadata in distribution containers
- Implementation-specific loading behaviors beyond the standard loader
- Additional validation rules beyond schema and lint

**Prohibited extensions (MUST NOT):**
- Adding new required KDNA files beyond the 6 standard files
- Removing or renaming standard fields
- Changing the semantics of existing fields
- Embedding executable code or workflow steps within KDNA files
- Using KDNA files as general-purpose configuration stores

## 1.6. Judgment Model

KDNA encodes domain judgment. This section defines what judgment consists of and how the 13 constituent elements map to KDNA file structures.

A **judgment** in KDNA is a domain-specific process that includes:

1. Classifying the current situation into a type the domain recognizes
2. Applying domain values, boundaries, and risk models
3. Weighing trade-offs between action paths
4. Selecting a response framework
5. Verifying the output against domain standards

### 1.6.1. Thirteen Judgment Components

The following table maps each component to its meaning and its location within
the internal domain tree encoded inside `payload.kdnab`. The "KDNA File" column
refers to logical file names within the CBOR payload, not to ZIP entries in the
distribution container. See [Container Specification](specs/container.md) for
the wire format.

| Component | Meaning | KDNA File | Field |
|-----------|---------|-----------|-------|
| `worldview` | Default assumptions about how the world works in this domain | `KDNA_Core.json` | `worldview` (top level) |
| `values` | What matters more than what | `KDNA_Core.json` | `value_order`, `stances` |
| `purpose` | What this judgment serves | `meta` / `KDNA_Core.json` | `purpose`, `highest_question` |
| `role` | Who is judging and what they are responsible for | `KDNA_Core.json` | `judgment_role` |
| `knowledge` | Background knowledge that shapes judgment | `KDNA_Core.json` / `KDNA_Cases.json` | `ontology`, `cases` |
| `ontology` | How concepts are carved up and bounded | `KDNA_Core.json` | `ontology` |
| `classification` | Which situation type the current input belongs to | `KDNA_Scenarios.json` | `scenes[].trigger_signals` |
| `taste` | What counts as good vs. bad in this domain | `KDNA_Patterns.json` | `aesthetic_preferences` |
| `boundaries` | What must not be done | `KDNA_Patterns.json` | `boundaries`, `banned_terms` |
| `risk_model` | Which errors cost the most | `KDNA_Patterns.json` | `risk_model` |
| `context_signals` | When to trigger which judgment apparatus | `KDNA_Scenarios.json` | `trigger_signals`, `negative_signals` |
| `experience` | Historical cases and failure patterns | `KDNA_Cases.json` / `KDNA_Patterns.json` | `cases`, `counterexamples`, `misunderstandings` |
| `evaluation` | How to confirm judgment was valid | `evals/` directory / `KDNA_Evolution.json` | `eval_results`, `measurement` |

A domain author SHOULD populate all components that are relevant to the domain's judgment surface. A component MAY be omitted when the domain's judgment does not depend on it (e.g., a purely diagnostic domain may omit `taste`).

### 1.6.2. Boundary Statement

KDNA does not claim to exhaust human judgment. It provides a structured method for approximating repeatable judgment patterns: principles, concept distinctions, signals, boundaries, risks, cases, and evaluation. Some judgment remains implicit, situational, and the ultimate responsibility of the human operator.

### 1.6.3. Anti-Monolithic Domain Principle

A single KDNA domain SHOULD encode one bounded, testable, comparable judgment question. If a domain requires multiple unrelated judgment questions, the author MUST split it into multiple domains and compose them via cluster. A KDNA is not a knowledge base, encyclopedia, or comprehensive reference for a professional field. It is a judgment asset.

**Companion rule (authoring-time gate, enforced by `kdna dev validate --anti-monolithic`):**

If a domain's `KDNA_Core.json` exceeds 6 primary axioms **and** contains 3 or more `frameworks` **and** spans more than 2 distinct user-facing judgment questions, the author MUST either:

- (a) split into sub-domains and reference them via cluster, or
- (b) justify the monolithic structure in a `module_manifest.json` with a `decomposition_rationale` of at least 30 characters and obtain a maintainer sign-off recorded in the TC.

The `decomposition_rationale` MUST explain why the domain's multiple parts cannot be loaded, evaluated, and evolved independently. A short placeholder ("todo", "later", "TBD") does not count as a substantive sign-off and is treated as missing.

**Lint behavior (per RFC-0013 §4):**

- **Default** (`kdna dev validate --anti-monolithic`): WARNING. The lint does not block CI. The maintainer sees the warning and either acts on it or formally records a sign-off.
- **Strict** (`kdna dev validate --anti-monolithic --strict`): ERROR. Used by `kdna publish --official-preflight` and similar gates. A domain cannot be officially published while this rule is triggered without a sign-off.
- **Soft warning** (when thresholds are exceeded but a substantive `decomposition_rationale` is present): a soft warning names the recorded sign-off so it stays visible in CI logs without false-positive blocking. Reviewers should still periodically re-evaluate whether the rationale still holds.

**Examples (good vs bad, per RFC-0013 §4):**

| Bad | Good |
|-----|------|
| `@aikdna/business` (covers strategy, ops, finance, sales, HR, legal) | `@aikdna/price_objection_diagnosis` + `@aikdna/landing_page_trust` + `@aikdna/meeting_decision_quality` |
| `@aikdna/writing` (covers blog, academic, marketing, technical, fiction) | `@aikdna/blog_intro_hook` + `@aikdna/academic_methodology_passive_voice` + `@aikdna/landing_copy_above_fold` |
| `agent-project-context` as a single 800-line `KDNA_Core.json` | `agent-project-context` (single question) + sub-domain `project_phase` only if independently loadable; otherwise `internal_module` |

This principle is enforced by lint, not by prose. The canonical implementation lives in `aikdna/kdna-cli` (`src/cmds/anti-monolithic.js`); the principle text originates in RFC-0013 §4.

## 1.7. Judgment Update Governance

KDNA domains encode judgment standards. When a self-improving agent learns from work, not all learning is equal. This section defines which updates agents MAY apply automatically and which changes need explicit governance provenance before a reviewed release may claim human confirmation.

### 1.7.1. Three Classes of Updates

| Class | Auto-Apply? | Examples |
|-------|-------------|----------|
| **Operational** | Yes | Tool call parameters, API formats, output formatting preferences, project-specific commands |
| **Evidence** | Record only | New outcome records, eval failures, trace anomalies, user feedback |
| **Judgment** | **No** | Axioms, value order, boundaries, risk models, composition policy |

Operational updates improve execution without changing what the agent considers correct. Evidence updates provide raw material for future proposals but do not modify judgment standards. Judgment updates change what the agent holds to be true, valuable, or risky — these MUST enter governance when a release claims reviewed, human-confirmed, organization-approved, or signed provenance.

### 1.7.2. Fields Requiring Governance Provenance

For reviewed release workflows, changes to the following fields MUST NOT be
presented as human-confirmed or organization-approved without governance
provenance. Human Judgment Lock is one supported provenance record, but it is
not a Core format-validity requirement for every `.kdna` file:

- `axioms` — any addition, removal, or revision
- `value_order` — any reorder, addition, or removal
- `judgment_role` — any change
- `boundaries` — any change to what must not be done
- `risk_model` — any change to which errors cost the most
- `does_not_apply_when` — any change to applicability conditions
- `failure_risk` — any change to stated risks
- `composition.policy.json` — any change to domain composition rules

A validator for a reviewed/Human-Locked profile MUST reject a `.kdna` asset
that claims human confirmation while containing judgment-class changes without
corresponding governance provenance. A plain `.kdna` asset without Human Lock
remains valid at the format layer if it otherwise validates; trust, authorship,
review state, and distribution status are separate layers.

### 1.7.3. Human Judgment Lock Format

A Human Judgment Lock is an optional governance-provenance entry in
`KDNA_Evolution.json` under `human_locks`:

```
{
  "lock_id": "string",
  "proposal_id": "string (optional)",
  "locked_at": "ISO-8601 timestamp",
  "locked_by": "human identifier",
  "lock_type": "accept | reject | defer",
  "reason": "non-empty string",
  "affected_files": ["KDNA_Core.json", ...]
}
```

Anonymous locks are prohibited. Every `accept` lock SHOULD reference an improvement proposal. Emergency overrides MUST be documented and ratified within 72 hours.

## 2. Conformance Levels

Implementations MAY conform at one of three levels:

| Level | Requirements |
|-------|-------------|
| **Loader** | Reads and formats KDNA files for agent context |
| **Validator** | Loader + validates structural compliance |
| **Full** | Validator + supports all optional files + behavioral eval |

## 3. KDNA Asset

### 3.1 Canonical Form

A KDNA domain MUST be represented, distributed, installed, verified, and loaded as a `.kdna` container.

The judgment payload of a `.kdna` container is encoded as strict CBOR in
`payload.kdnab`. Source trees (`KDNA_Core.json`,
KDNA_Patterns.json, etc.) are authoring workspaces only and MUST NOT appear as
top-level entries in a distribution `.kdna` asset. See `specs/container.md`.

A `.kdna` asset MUST include a `kdna.json` manifest at the archive root.

### 3.2 Required Entries (Distribution Asset)

A conforming distribution `.kdna` asset MUST include:

| Entry | Description | Status |
|-------|-------------|--------|
| `kdna.json` | Public manifest and metadata (no judgment content) | REQUIRED |
| `payload.kdnab` | Encoded judgment payload, all domain content (CBOR) | REQUIRED |
| `signature.kdsig` | Ed25519 signature over canonical payload digest | **OPTIONAL until 2027-Q1; REQUIRED after** |

> **Status note (2026-06-27):** The `signature.kdsig` entry is reserved by the container layout but is **OPTIONAL** in current implementations. Ed25519 signing infrastructure is in place (`@aikdna/kdna-core` identity module), but signature generation and verification across the publish → install → load chain is not yet integrated into the official toolchain. The hard cutover date for making `signature.kdsig` REQUIRED is **2027-Q1** (end of March 2027). Assets distributed before that date remain conformant without `signature.kdsig`; assets distributed on or after 2027-Q1 MUST include it. This is a normative deadline — extensions are not granted by silence.

A `.kdna` asset MUST NOT include `KDNA_Core.json`, `KDNA_Patterns.json`, `KDNA_Scenarios.json`, `KDNA_Cases.json`, `KDNA_Reasoning.json`, or `KDNA_Evolution.json` as top-level ZIP entries. Those files belong to the source tree only.

### 3.3 Source Tree

The authoring source tree uses standard JSON files for human editing and Git review:

| File | Responsibility |
|------|---------------|
| `KDNA_Core.json` | Axioms, ontology, frameworks, causal structure, stances |
| `KDNA_Patterns.json` | Terminology, banned terms, misunderstandings, self-checks |

A valid source tree MUST include `KDNA_Core.json` + `KDNA_Patterns.json`. Optional files MAY include `KDNA_Scenarios.json`, `KDNA_Cases.json`, `KDNA_Reasoning.json`, `KDNA_Evolution.json`. Maximum 6 KDNA JSON files (excluding `kdna.json`).

#### 3.3.1 Optional File Semantics

Each optional file MAY be legitimately absent when the domain's judgment surface does not require it. To prevent consumer confusion between "does not need this file" and "has not written it yet," domain authors MAY document the reason for absence:

| File | Can Be Absent When |
|------|-------------------|
| `KDNA_Scenarios.json` | Domain judgment does not depend on situation-specific triggers. All axioms apply uniformly. |
| `KDNA_Cases.json` | Axioms are self-demonstrating without worked examples. The domain's concepts are simple enough that cases add no clarity. |
| `KDNA_Reasoning.json` | Axioms contain their own rationale (the `why` field is sufficient). No separate reasoning chains are needed. |
| `KDNA_Evolution.json` | Domain is designed as a static judgment reference, not a progressive skill path. No stage-based growth model exists. |

If a domain omits optional files, it SHOULD document the reason in its README. A domain reviewer or tool consumer who sees "2/6 files" MUST NOT assume incompleteness without reading the domain's rationale for omission.

#### 3.3.2 Separate Validity, Access, And Optional Evidence

KDNA does not collapse format validity, author-declared access, evidence, and
consumer trust into one badge.

| Dimension | Meaning | Format-validity effect |
|-----------|---------|------------------------|
| Format validity | Schema, CBOR, container, digest, and authorization contract | Required |
| `access` | Author chooses `public`, `licensed`, or `remote` | Determines consumption path, not quality |
| Evidence claims | Optional statements about observed behavior or review | None unless the author makes that claim |
| Consumer trust | Whether a caller chooses to rely on the asset | Decided by the caller, never Core |

An asset without behavioral evaluation, field validation, expert review, or a
quality label remains a valid KDNA asset. Core MUST NOT issue or verify a
`quality_badge`, rank content, or decide that an author's judgment is good.
Catalogs and applications MAY display bounded evidence facts, but those facts
are separate from the container protocol and from permission to create.

### 3.4 Manifest

A `.kdna` distribution asset MUST include the single `kdna.json` manifest
defined normatively in §14.4 and `schema/manifest.schema.json`. There is no
second source-tree manifest dialect.

The required identity fields are `kdna_version`, `asset_id`, `asset_uid`,
`asset_type`, `title`, `version`, `judgment_version`, `created_at`,
`updated_at`, `compatibility`, and `payload`. Optional `creator` provenance does
not gate Runtime validity; when present, its `name` must be non-empty. The payload entry is
always `payload.kdnab` with `encoding: "cbor"`.

Top-level `format_version`, `spec_version`, `quality_badge`, and `container`
are not current protocol discriminators. Optional evidence claims describe
only what the author has chosen to claim and do not affect format validity.

## 4. Shared Root Structure

Every KDNA JSON file MUST include a `meta` object at the root with these REQUIRED fields:

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Spec version this file conforms to (e.g., "1.0-rc") |
| `domain` | string | Domain identifier matching the package name |
| `created` | string | ISO 8601 date (YYYY-MM-DD) |
| `purpose` | string | One-sentence description of this file's role |
| `load_condition` | string | Human-readable condition for when to load this file |

The `domain` field MUST be identical across all internal files in a `.kdna` asset.

## 5. Core File (`KDNA_Core.json`)

### 5.1 Required Fields

`KDNA_Core.json` MUST include:

- `meta` (object) — See Section 4
- `axioms` (array) — Core judgment principles
- `ontology` (array) — Key domain concepts
- `frameworks` (array) — Diagnostic frameworks
- `core_structure` (array) — Causal movement mapping
- `stances` (array of strings) — Domain default positions

### 5.2 Axiom

Each axiom MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier within the domain |
| `one_sentence` | string | Core principle in one sentence |
| `full_statement` | string | Complete, testable explanation |
| `why` | string | Why this principle matters for agent judgment |
| `applies_when` | array of strings | Specific situations where this axiom is applicable |
| `does_not_apply_when` | array of strings | Specific situations where this axiom SHOULD NOT be applied |
| `failure_risk` | string | What failure occurs when this axiom is over-applied or misapplied |
| `confidence` | string | Confidence under the domain's expected evidence conditions (high/medium/low). NOT absolute truth confidence — the same axiom may have high confidence in one evidence context and low in another |
| `evidence_type` | string | Type of evidence supporting this axiom (practice_patterns / research_finding / industry_consensus / case_observation) |

A domain SHOULD have between 2 and 6 axioms.

### 5.3 Ontology Concept

Each concept MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `one_sentence` | string | Definition in one sentence |
| `essence` | string | What this concept really means |
| `boundary` | string | What this concept is NOT |
| `trigger_signal` | string | When the agent should notice this concept |

### 5.4 Framework

Each framework MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Human-readable name |
| `when_to_use` | string | When to apply this framework |
| `steps` | array of strings | Ordered concrete steps |

### 5.5 Core Structure

Each core structure entry MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Surface symptom or starting state |
| `to` | string | Deeper cause or resolution |
| `via` | string | Diagnostic path or mechanism |

### 5.6 Stances

Stances MUST be an array of strings. Each string expresses the domain's default position on a relevant issue. A domain SHOULD have between 2 and 5 stances.

## 6. Patterns File (`KDNA_Patterns.json`)

### 6.1 Required Fields

`KDNA_Patterns.json` MUST include:

- `meta` (object) — See Section 4
- `terminology` (object) — See Section 6.2
- `misunderstandings` (array) — See Section 6.3
- `self_check` (array of strings or `{ "question": string }` objects) — See Section 6.5

### 6.2 Terminology

`terminology` MUST include:

```json
{
  "standard_terms": [
    { "term": "...", "definition": "..." }
  ],
  "banned_terms": [
    { "term": "...", "why": "...", "replace_with": "..." }
  ]
}
```

Every banned term MUST include `why` (reason for avoidance) and `replace_with` (preferred alternative).

`standard_terms` and `banned_terms` SHOULD each have between 2 and 10 entries.

### 6.3 Misunderstandings

Each misunderstanding MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `wrong` | string | Common wrong interpretation |
| `correct` | string | Correct interpretation |
| `key_distinction` | string | The distinction the agent must preserve |
| `why` | string | Why this misunderstanding creates bad judgment |

A domain SHOULD have between 2 and 6 misunderstandings.

### 6.4 Judgment Constraints

The following optional judgment constraint fields are schema-supported and SHOULD follow these shapes when present:

| Field | Type | Required item fields | Description |
|-------|------|----------------------|-------------|
| `aesthetic_preferences` | array | `prefer`, `avoid` | What good vs. bad expression, form, or taste looks like in this domain |
| `boundaries` | array | `rule`, `why` | What the domain must not do, and why |
| `risk_model` | object | none | Highest-risk errors, acceptable errors, hard blocks, and warning conditions |

### 6.5 Self-Checks

`self_check` MUST be an array of strings or objects with a `question` string. Each item MUST be answerable with yes or no. Self-checks SHOULD test domain-specific judgment, not generic quality.

Valid forms:

```json
[
  "Did the response diagnose the domain-specific failure before prescribing an action?",
  {
    "question": "回答是否先区分事实和假设？",
    "applies_when": ["The output makes a recommendation"]
  }
]
```

A domain SHOULD have between 2 and 6 self-check items.

## 7. Optional Files

### 7.1 Scenarios (`KDNA_Scenarios.json`)

When present, MUST include:

- `meta` (object)
- `scenes` (array)

Each scene MUST include `id`, `name`, `trigger_signal`, and `sub_scenarios`.

Each sub-scenario MUST include `id`, `trap_belief`, `action_template`, and `expected_result`. `action_template` MUST be an array of strings. `replace`, when present, MUST be an array of `{ "avoid": string, "use": string }` objects. `three_questions`, when present, MUST contain `belief`, `state`, and `need`.

### 7.2 Cases (`KDNA_Cases.json`)

When present, MUST include:

- `meta` (object)
- `cases` (array)

Each case MUST include `id`, `title`, `context`, `what_happened`, `what_was_learned`, and `structural_pattern`. A case MAY include `scene_id` referencing a scenario.

### 7.3 Reasoning (`KDNA_Reasoning.json`)

When present, MUST include:

- `meta` (object)
- `reasoning_chains` (array)

Each chain MUST include `id`, `one_sentence`, `logic` (array of strings), and `so_what`.

### 7.4 Evolution (`KDNA_Evolution.json`)

When present, MUST include:

- `meta` (object)
- `stages` (array)
- `evolution_layers` (array)
- `measurement` (array)

Each stage MUST include `id`, `name`, `description`, and `indicators`.
Each layer MUST include `id`, `name`, `capability`, `from_stage`, and `to_stage`.
Each measurement MUST include `id`, `what`, `how`, and `threshold`. Measurements MUST describe observable behaviors.

## 8. Loading Behavior

### 8.1 Decision Tree

A conforming loader MUST follow this decision tree:

```
User message received
│
├─ Decode payload.kdnab and load judgment content
│
├─ Does input contain concrete situation/scene/case signals?
│   └─ Load KDNA_Scenarios.json
│
├─ Does input request examples or demonstrations?
│   └─ Load KDNA_Cases.json
│
├─ Does input ask why, rationale, or principles?
│   └─ Load KDNA_Reasoning.json
│
└─ Does input reference practice, growth, or measurement?
    └─ Load KDNA_Evolution.json
```

Multiple conditions MAY be true simultaneously.

### 8.2 Domain Selection

Single-asset loading is the default and MUST NOT silently route across other
assets. When a caller explicitly enables a Cluster, the Cluster runtime MAY
match task signals, select a primary asset and bounded advisors, and apply
declared conflict/budget policy. Core MUST NOT rank assets by content quality
or infer that a maturity label makes one author's judgment superior.

### 8.3 Response Protocol

After loading KDNA, the agent SHOULD:
1. Internalize axioms as the domain frame
2. Use preferred terminology; avoid banned terms
3. Detect likely misunderstandings in user framing
4. Apply frameworks appropriate to the situation
5. Run self-check items before final output

The agent SHOULD NOT announce KDNA loading in normal responses. The agent MUST NOT expose full KDNA content to the user unless in debug mode.

## 9. Validation

### 9.1 Structural Validation

A conforming validator MUST check:

1. For distribution assets: required container entries exist (`kdna.json` + `payload.kdnab`); forbidden source entries do not exist as top-level ZIP entries
2. For source trees: required files exist (`KDNA_Core.json` + `KDNA_Patterns.json`)
2. Every JSON file has a `meta` object with all required fields
3. Required top-level fields exist in each file
4. All `id` fields are unique within the domain
5. Cross-file references resolve (e.g., `scene_id` in Cases references a Scene)
6. Every banned term has `why` and `replace_with`
7. Every misunderstanding has `key_distinction`
8. Every reasoning chain has `so_what`
9. Self-check items are yes/no answerable
10. No more than 6 KDNA JSON files per domain

A validator SHOULD also verify that the `domain` field in `meta` is consistent across all files.

### 9.2 Optional Behavioral Evidence

Asset Assay, Cluster Assay, and field evaluation are optional evidence layers,
not container conformance requirements. Authors and consumers MAY compare
loaded and unloaded behavior, boundary handling, contamination, routing,
terminology, or task outcomes. Any published claim MUST identify its method,
fixtures, holdout boundary, and result; failure of an optional assay blocks
only that claim, never the right to create or distribute a structurally valid
asset.

## 10. Compatibility

KDNA MAY be used with:
- Agent Skills (as a judgment layer loaded before task execution)
- MCP Resources (as structured context provided to tools)
- RAG systems (as a judgment lens for retrieved documents)
- Prompt routers (as domain-specific system prompts)
- Custom agent runtimes
- Local file-based assistants

KDNA MUST NOT replace these systems. It provides a judgment layer that operates alongside them.

## 11. Security Considerations

- KDNA files are JSON, not executable code. They MUST NOT contain active scripts.
- Domains using `licensed` or `remote` access modes MUST be protected by the Runtime layer.
- The `kdna.json` manifest MUST NOT contain secrets or API keys.
- Loaders SHOULD validate JSON before parsing to prevent injection.

### 11.1 Encryption profile layering

Encrypted KDNA assets use one of three profile IDs. Each profile is
independent and MUST NOT silently cross-migrate. The non-collapse
invariant (RFC-0018 R4.3) applies to all three.

| Profile ID | RFC | Algorithm | KDF | Required support |
|------------|-----|-----------|-----|------------------|
| `kdna.encryption.licensed-entry` | RFC-0008 | AES-256-GCM, AES-256-KW | HKDF-SHA256 | Mandatory (compat path) |
| `kdna.encryption.password` | RFC-0009 | AES-256-GCM, AES-256-KW | Argon2id | Optional (compat path) |
| `kdna.envelope.aead` | **RFC-0018** (frozen 2026-06-28) | AES-256-GCM, AES-256-KW | `scrypt-sha256-v1` (mandatory) or `argon2id-v1` (optional v2, Node.js only) | Mandatory for new exports |

The `kdna.envelope.aead` profile is the canonical target for new
product-facing exports. Test vectors are at
`conformance/envelope-aead/`. A Swift port that does not
implement Argon2id MUST either fall back to the next slot's
`scrypt-sha256-v1` KDF or fail with `KDNA_KDF_UNSUPPORTED` (RFC-0018
R6). There is no silent fall-through.

## 12. Version Policy

- KDNA tools implement the KDNA schema and media type.
- Pre-GA aliases and package layouts are not part of the open protocol.
- Loaders MUST reject manifest fields that are not defined by the active schema.

### 12.1 Domain Version Semantics

KDNA domains follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH). The `kdna.json` manifest `version` field and each file's `meta.version` MUST use semver.

| Level | Increment when | Examples |
|-------|---------------|----------|
| **PATCH** (0.4.x) | Content refinement without structural change | Fix typo in axiom statement, clarify ontology boundary wording, improve self-check phrasing |
| **MINOR** (0.x.0) | New judgment structures added; no breaking changes to existing logic | Add new axiom, add ontology concept, add framework, add misunderstanding, add scenario |
| **MAJOR** (x.0.0) | Breaking changes to existing judgment logic | Remove axiom, change framework steps order, redefine concept boundary, change self-check trigger |

A domain at `v0.2.0` with only Core+Patterns is less mature than `v0.4.0` with Core+Patterns+Scenarios+Cases. The version number reflects structural evolution, not functional superiority. Two domains at different versions MAY both be valid for their respective scopes.

The container contract is selected only by `kdna_version`. Top-level
`spec_version` is not a current manifest field. Subsystems such as evidence or
conformance reports MAY version their own schemas without creating another
KDNA asset format.

## 13. Domain Composition and Clusters

KDNA domains MAY be composed into clusters to handle multi-faceted judgment tasks. A cluster is a composable judgment system — not a merged domain, but a coordinated assembly of independent domains with explicit composition rules.

### 13.1 Conceptual Model

```
Judgment Asset   = One independently loadable .kdna asset
Judgment Cluster = Explicit manifest referencing multiple .kdna assets
Judgment System  = Caller-owned use of one or more assets or Clusters
```

An asset encodes one bounded judgment system. A Cluster defines how multiple
independently valid and independently authorized assets are selected and
composed. Single-asset use is the foundational/default path; Cluster use is an
explicit advanced path. Neither replaces the other.

### 13.2 Cluster Types

| Type | Purpose | Loading Strategy |
|------|---------|-----------------|
| `horizontal` | Cross-domain capability cluster (e.g., content creation) | signal_based |
| `vertical` | Business process cluster (e.g., product launch) | staged |
| `governance` | Safety and compliance overlay cluster | always-on / risk-triggered |
| `enterprise_system` | Organization-wide judgment governance | fixed with overlay |

### 13.3 Cluster Manifest

A cluster MUST include a `kdna.cluster.json` manifest describing its domains and composition rules. The manifest is separate from the 6-file domain standard — a cluster is a composition layer above domains, not a 7th domain file.

**Required fields:** `cluster_id`, `name`, `version`, `domains[]`, `composition`.

**Domain entries** within the cluster MUST declare:
- `id`: Fully qualified domain name (`@scope/name`)
- `version`: Acceptable version range (semver-compatible)
- `role`: `primary` | `advisor` | `risk_guard` | `style_and_trust` | `evaluator`
- `required`: Whether this domain MUST be loaded for the cluster to function
- `load_condition`: Human-readable condition for when this domain is activated

**Relationships** between domains within the cluster MAY be declared:
- `depends_on` — Domain A requires Domain B's output
- `constrains` — Domain A limits Domain B's recommendations
- `overrides` — Domain A takes precedence over Domain B
- `blocks` — Domain A prevents Domain B from activating
- `informs` — Domain A provides context for Domain B
- `conflicts_with` — Two domains produce contradictory guidance

### 13.4 Composition Strategies

A cluster MUST declare one of five composition strategies:

| Strategy | Behavior |
|----------|----------|
| `fixed` | All declared domains load unconditionally |
| `signal_based` | Domains activate based on trigger_signals matching user input |
| `staged` | Domains load in ordered phases (e.g., analysis → risk review → expression) |
| `overlay` | A primary domain paired with always-on governance domains |
| `user_confirmed` | System recommends domains; user confirms selection |

### 13.5 Conflict Policy

When multiple domains produce contradictory guidance, a conforming runtime SHOULD surface the conflict rather than silently resolve it, unless explicit priority rules are defined in the composition policy.

Conflict types include: `value_conflict`, `term_conflict`, `risk_conflict`, `stance_conflict`, `framework_conflict`.

Resolution strategies: `surface` (expose to user), `priority_wins` (follow priority order), `risk_wins` (safety domain overrides), `block` (refuse to proceed), `ask_user`.

### 13.6 Load Profiles

To prevent token budget explosion with large clusters, domains MAY declare load profiles:

| Profile | Content | Use Case |
|---------|---------|----------|
| `index` | Manifest + trigger_signals only | Domain selection |
| `compact` | highest_question + axioms + risk_model + self_check | Lightweight judgment participation |
| `scenario` | Relevant scenarios + frameworks for current task | Task-specific judgment |
| `full` | All 6 files | High-relevance or high-risk tasks |

### 13.7 Composition Policy File

A cluster MAY include a separate `composition.policy.json` file defining detailed selection, priority, conflict, merge, and output rules. This is particularly relevant for enterprise governance clusters where organizational policy must be explicit and auditable.

### 13.8 Source Attribution

When multiple domains are composed into a single context, all injected content MUST preserve source attribution. Each axiom, misunderstanding, banned term, or self-check injected SHALL be prefixed with its origin: `[domain_id:field.id]`. This enables judgment trace to identify which domain influenced which part of the output.

### 13.9 Cluster Evaluation

Cluster evaluation is distinct from single-domain evaluation. A cluster eval MUST test:
1. Whether the correct domains were selected for a given input
2. Whether irrelevant domains were excluded
3. Whether conflicts were correctly surfaced
4. Whether priority rules were correctly applied
5. Whether the composed output is better than any single domain alone

---

## 14. KDNA Container Format (.kdna)

A `.kdna` file is the canonical asset format for KDNA domain cognition. It is a portable, self-contained, directly loadable, verifiable container — not merely a ZIP of JSON files and not merely a distribution artifact.

A `.kdna` file is the unit of identity, installation, verification, loading, and trust. Any source directory used by an authoring tool is a development workspace only.

### 14.1 Design Principles

1. **Self-contained:** A `.kdna` file MUST contain everything needed to install and verify a domain without external dependencies (except the CLI/loader).
2. **Verifiable:** Every `.kdna` file MUST be checksum-able and signable. The container is the unit of trust.
3. **Identity-carrying:** A `.kdna` file carries identity (name, version, author, scope) in its manifest. It is not an anonymous blob.
4. **Stable:** Once published, a specific version of a `.kdna` file MUST be immutable. Content changes produce a new container with a new version.
5. **Directly loadable:** A conforming runtime MUST load a `.kdna` asset without requiring persistent extraction to a domain directory.

### 14.2 Container Format

A `.kdna` file:

- **MUST** be a ZIP archive (application/zip).
- **MUST** use the `.kdna` file extension.
- **MUST NOT** be password-protected or encrypted at the container level (licensed domains use encrypted internal entries under the same `.kdna` asset; see [docs/kdna-encryption-authorization.md](./docs/kdna-encryption-authorization.md)).
- **MUST** use UTF-8 encoding for all text files within the archive.
- **MUST** use forward slash (`/`) as path separator within the archive.
- **SHOULD** use Deflate compression (ZIP method 8).

### 14.3 Required Contents

A valid `.kdna` KDNA Asset Container MUST contain:

| File | Required | Description |
|------|----------|-------------|
| `mimetype` | REQUIRED | Fixed media type marker. Content MUST be `application/vnd.kdna.asset` with no trailing newline. |
| `kdna.json` | REQUIRED | Container manifest (see §14.4) |
| `payload.kdnab` | REQUIRED | CBOR-encoded judgment payload containing all domain content (axioms, patterns, cases, scenarios, reasoning, evolution) |
| `checksums.json` | OPTIONAL | Per-entry hash integrity records |

Optional entries MAY include `signatures/` and `attachments/` subdirectories.

A `.kdna` asset MUST NOT contain `KDNA_Core.json`, `KDNA_Patterns.json`, `KDNA_Scenarios.json`, `KDNA_Cases.json`, `KDNA_Reasoning.json`, or `KDNA_Evolution.json` as top-level ZIP entries. Those files belong to the source tree only (see §3.2). Containers with source tree files at the top level MUST be rejected as legacy plaintext ZIP format.

The `mimetype` entry MUST be located at the ZIP root. Writers SHOULD store it as
the first ZIP entry and SHOULD NOT compress it. Loaders MUST check both
`mimetype` and `kdna.json`; a `.kdna` extension alone is not sufficient to treat
an archive as a valid KDNA asset.

### 14.4 Container Manifest (`kdna.json`)

Every `.kdna` container MUST include a `kdna.json` at the archive root. This file declares the container's identity, version, and verification metadata.

`kdna_version` is the sole container wire discriminator. Its current and only
accepted value is `"1.0"`. Top-level `format_version` and `spec_version` are
removed legacy fields and MUST NOT be emitted. See
[version-taxonomy.md](docs/version-taxonomy.md).

```json
{
  "kdna_version": "1.0",
  "asset_id": "kdna:example:writing",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Editorial Writing Judgment",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "created_at": "2026-07-01T00:00:00.000Z",
  "updated_at": "2026-07-01T00:00:00.000Z",
  "creator": {
    "name": "Example Author",
    "id": "example-author"
  },
  "compatibility": {
    "min_loader_version": "0.15.12",
    "profile": "kdna.payload.judgment"
  },
  "payload": {
    "path": "payload.kdnab",
    "encoding": "cbor",
    "encrypted": false
  },
  "access": "public",
  "lineage": {
    "type": "original"
  }
}
```

**Required fields:** `kdna_version`, `asset_id`, `asset_uid`, `asset_type`,
`title`, `version`, `judgment_version`, `created_at`, `updated_at`,
`compatibility`, and `payload`.

`payload.path` MUST be `payload.kdnab`, `payload.encoding` MUST be `cbor`, and
`payload.encrypted` records whether the entry contains a supported encryption
envelope.

**Optional fields:** `creator`, `summary`, `description`, `language`,
`languages`, `license`, `keywords`, `domain_field`, `lineage`, `digests`, `signatures`,
`dependencies`, `encryption`, `load_contract`, `scope`, and `evidence_claims`.
`access` declares `public`, `licensed`, or `remote` consumption behavior.

`asset_id` is human-readable and does not require registration in a central
namespace. `asset_uid` supplies globally unique identity. `kdna_spec`,
top-level `format_version`, and top-level `spec_version` are not part of the
current manifest contract.

#### 14.4.1 Source Mode

`source_mode` declares how this domain was originally created:

| Value | Description |
|-------|-------------|
| `"blank"` | Created from scratch in Studio (original creation) |
| `"kdna_asset"` | Forked or adapted from an existing `.kdna` asset |
| `"source_folder"` | Migrated from a legacy JSON source folder |

Assets with `source_mode: "kdna_asset"` SHOULD include a `lineage` record documenting the parent asset. Assets with `source_mode: "source_folder"` SHOULD record migration provenance. Human Lock MAY be used when human confirmation is required, but it is not a format-validity requirement.

#### 14.4.2 Creator Identity

`creator` records the local creator, agent, tool, or organization identity associated with this asset:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Required human-readable creator, Agent, tool, or organization name |
| `id` | string | Optional creator-controlled identifier |

Creator metadata does not require registration and is not a quality or trust
claim. Key-bound provenance belongs to the signature mechanism; a signature
proves that a key signed bytes, not that the content is correct or endorsed.

#### 14.4.3 Lineage

`lineage` documents the derivation history when an asset is not an original creation:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"original"`, `"fork"`, `"adaptation"`, `"translation"`, `"private_variant"`, `"organization_variant"`, or `"course_variant"` |
| `parent_name` | string | Name of the parent KDNA asset |
| `parent_asset_uid` | string | Asset UID of the parent |
| `parent_version` | string | Version of the parent at time of fork |
| `parent_asset_digest` | string | Digest of the parent .kdna asset |

Trust is NOT inherited through lineage. Forked, adapted, or migrated assets SHOULD record their own provenance and MAY go through Human Lock when human confirmation is required. Assets without Human Lock remain structurally valid, but consumers SHOULD treat them as unconfirmed unless another trust signal applies.

### 14.5 Digest

- **Asset digest:** `asset_digest` is the SHA-256 hash of the complete `.kdna` file bytes. It MUST be recorded outside the container, such as in a local receipt or lockfile.
- **Content digest:** `content_digest` is the canonical SHA-256 hash of the internal content tree. The content tree includes all non-directory ZIP entries except `signature.json`, `.DS_Store`, `build-receipt.json`, `reports/*`, and local installation metadata. Reports and build receipts are build evidence, not judgment content — they are not part of the content digest. If stored in `kdna.json`, the `content_digest` field itself (and other self-referencing digest fields) are excluded from its own digest calculation.
- Registries MUST use `asset_digest` for every installable `.kdna` asset and MAY also publish `content_digest`.
- Consumers that rely on local receipts or lockfiles MUST verify `asset_digest` before trusting the asset.
- Digest verification MUST fail closed: any mismatch prevents installation.

The complete asset digest MUST NOT be embedded as a self-referential `container_sha256` field inside `kdna.json`.

### 14.6 Signing

Signing is an **optional enhancement** to `.kdna` assets. A `.kdna` container MAY be signed using Ed25519.

- The signature covers the **content tree**: every non-directory ZIP entry except `signature.json`, `.DS_Store`, and local installation metadata, sorted by path. JSON entries are canonicalized with lexicographically sorted object keys before hashing. For `kdna.json`, `signature`, `asset_digest`, `container_sha256`, local `_source`, and self-referential digest fields are excluded.
- The signing key corresponds to the publisher's identity.
- The signature is stored in `kdna.json`:
  ```json
  {
    "author": {
      "pubkey": "ed25519:43d22af8f0e189b6fd42bfaab710f52f4bc5f0ae3f5e04719a1a1d9ce9760fbe",
      "public_key_pem": "-----BEGIN PUBLIC KEY-----..."
    },
    "signature": "ed25519:<hex-signature>"
  }
  ```
- An unsigned `.kdna` file is a **valid KDNA asset**. Signature presence is a trust-layer enhancement, not a format-validity requirement.
- A specific platform, organization, or runtime policy MAY require signatures for assets listed there; such requirements are platform policy, not KDNA Core format rules.

### 14.7 Install and Load Behavior

Loading a `.kdna` asset for agent consumption follows this path:

1. `kdna validate <file.kdna>` — structural and schema validation
2. `kdna plan-load <file.kdna>` — returns a LoadPlan with authorization diagnostics
3. `kdna load <file.kdna> --profile=compact --as=prompt` — renders judgment content for agent injection

The LoadPlan MUST return `can_load_now: true` before loading proceeds.
The runtime MAY cache load results internally, but caches are rebuildable and
MUST NOT become the trust source.

### 14.8 CLI Operations on Containers

| Command | Operation |
|---------|-----------|
| `kdna validate <file.kdna>` | Structural and schema validation |
| `kdna inspect <file.kdna>` | Display container metadata |
| `kdna plan-load <file.kdna>` | Return LoadPlan with authorization diagnostics |
| `kdna load <file.kdna> --profile=compact --as=prompt` | Render judgment content for agent injection |
| `kdna pack <source-dir> <output.kdna>` | Build a `.kdna` asset from a source tree |
| `kdna unpack <file.kdna> <output-dir>` | Extract a `.kdna` asset for inspection |
| `kdna dev pack ./writing-source` | Build a dev-only diagnostic bundle from a non-canonical source directory. For release-evidence authoring, use `kdna-studio migrate`. |
| `kdna dev unpack writing.kdna` | Unpack into a dev source directory for inspection or editing |

### 14.9 Platform Recognition

For operating system-level recognition of `.kdna` files:

| Platform | Mechanism |
|----------|-----------|
| **macOS** | UTType: `com.aikdna.kdna` (or `public.kdna`). Registered by a KDNA-compatible client Mac App. Double-click opens in a KDNA-compatible client for inspection and installation. |
| **Windows** | File extension association with a KDNA-compatible client or CLI. |
| **Linux** | MIME type `application/vnd.kdna.asset`. Desktop file association. |

The recommended media type is `application/vnd.kdna.asset`.
`application/x-kdna` is not a KDNA Core media type and MUST be rejected in
registry metadata, HTTP responses, and OS integration files. See
[`docs/MEDIA_TYPE.md`](./docs/MEDIA_TYPE.md).

### 14.10 Asset vs Dev Source Directory

| | Dev Source Directory | .kdna Asset |
|---|---|---|
| **Purpose** | Authoring workspace | Canonical asset, installation, verification, loading |
| **Location** | Any filesystem path | `~/.kdna/packages/@scope/name/version/name.kdna` |
| **User-facing** | No | Yes |
| **Verifiable** | Dev validation only | Via `kdna verify` + checksum + signature |
| **Immutable** | No | Yes (once published) |
| **Directly Loadable** | No | Yes |

Domain authors MAY work in directories. Users install `.kdna` assets; Agents
consume the authorized Runtime Capsule emitted by the loader. The `.kdna` file
is the distribution object, while the directory is an authoring representation.

A `.kdna` asset can be created through multiple paths. The recommended path is the official Studio-compatible pipeline, which can include human confirmation, validation, canonicalization, identity generation, digest computation, optional signing, optional encryption, and provenance recording. A `.kdna` file created directly by an agent through the official SDK and validated by `kdna validate` is equally valid.

---

## 15. Authoring Paths

### 15.1 Creation Paths

A `.kdna` asset is a **structurally valid file container**. Multiple creation paths are valid:

| Path | Description |
|---|---|
| **Official toolchain** | Studio Core / CLI / MCP / SDK — recommended creation and validation path |
| **Agent-authored** | An AI Agent invokes the official SDK, CLI, Loader API, or a complete compatible producer to create and validate `.kdna` |
| **Human-authored** | Domain expert authors source files manually or via Studio, validated by official toolchain |
| **Hybrid** | Agent proposes judgment content; human reviews and confirms; toolchain validates |
| **Third-party compatible** | A tool that implements the complete producer contract and passes official conformance and validation |

A `.kdna` file is format-valid when it passes `kdna validate`, regardless of
author identity, signature presence, optional evidence, or Human Lock status.
Creation remains toolchain-mediated: Agents MUST NOT treat hand-written ZIP or
CBOR assembly as the normal authoring path.

### 15.2 Recommended Creation: Official Toolchain

The official KDNA toolchain (Studio Core + CLI + SDK) is the **recommended** creation path. It provides:
- Guided authoring with judgment cards
- Automated validation and cross-file consistency checks
- Compilation, digest computation, and provenance metadata
- Optional Human Lock, signing, and encryption

Agent and third-party tools SHOULD use the official SDK or CLI. Developer
inspection may expose source representations, but normal creation and
consumption MUST preserve the container, authorization, and Capsule contracts.

### 15.3 Official Toolchain Metadata

Assets created through Studio Core MAY include additional metadata fields:

- `kdna.json` provenance: `authoring.created_by`, `authoring.compiler`, `authoring.compiler_version`, `authoring.project_uid`, `authoring.asset_uid`, `authoring.build_id`, `authoring.content_digest`
- `KDNA_CARD.json`: risk level, intended use, out-of-scope, known limitations, review status
- `reports/`: build report, provenance report, human-lock report, quality-gate report, and eval report

These metadata files are informational and do NOT alter the domain's judgment content. A loader MAY ignore them.

### 15.4 No Parallel Dialect

Studio Core MUST NOT create a parallel KDNA dialect. This specification defines the KDNA Container contract and the default Judgment Profile v1. Studio Core is an authoring tool, not a spec extension. Future payload profiles MUST be introduced through an explicit RFC and remain compatible with the container, manifest, digest, entitlement, and LoadPlan rules defined here.

See [`rfcs/RFC-0016-container-profile-split.md`](./rfcs/RFC-0016-container-profile-split.md) for the active split plan between the container contract and Judgment Profile v1.

---

## 16. Internationalization and Localization

KDNA domains encode judgment. Localization changes the language of expression, not the logic of judgment. See [KDNA_I18N_SPEC.md](./docs/KDNA_I18N_SPEC.md) for the full specification.

### 16.1 Core Principle

**Localization MUST NOT change the logical meaning of axioms, boundaries, risks, or self-checks.**

### 16.2 Language Declaration

Every domain MUST declare its language configuration in `kdna.json`:

```json
{
  "default_language": "en",
  "languages": ["en", "zh-CN"],
  "i18n_level": "L2"
}
```

- `default_language`: The primary language of the domain's judgment content
- `languages`: All languages for which the domain provides localization
- `i18n_level`: L0 (monolingual) through L4 (full locale evals)

### 16.3 Localization Levels

| Level | Requirements |
|:-----:|-------------|
| L0 | Canonical language only |
| L1 | Localized KDNA_CARD.json + README in `locales/<tag>/` |
| L2 | L1 + localized text fields for core axioms and misunderstandings via overlay |
| L3 | L2 + full overlays for all 6 KDNA files |
| L4 | L3 + locale-specific eval cases |

Public `.kdna` examples published by the KDNA team or other public KDNA releases SHOULD achieve at least L1 in en + zh-CN as a quality practice. This is a publishing recommendation, not a format-validity requirement.

### 16.4 Locale Directory Structure

```
locales/
  zh-CN/
    KDNA_CARD.json          # Localized governance metadata
    README.md                # Localized human-readable documentation
    KDNA_Core.overlay.json   # L2+: text field translations
    KDNA_Patterns.overlay.json
    evals.json               # L4: locale-specific test cases
```

### 16.5 Overlay Format

Locale overlays translate text fields only. They reference canonical IDs and MUST NOT add, remove, or reorder structural fields.

```json
{
  "locale": "zh-CN",
  "base": "en",
  "translations": {
    "ax_001.one_sentence": "Translated text...",
    "ax_001.full_statement": "Translated text...",
    "ms_001.key_distinction": "Translated text..."
  }
}
```

### 16.6 Validation

A conforming validator MUST verify:
1. Declared `languages` match actual `locales/` directories
2. Overlay IDs reference existing canonical IDs
3. Overlays do not modify structural fields
4. Localized KDNA_CARD has all required fields
5. `i18n_level` matches actual content coverage

---

## 17. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) — Key words for use in RFCs
- [Semantic Versioning](https://semver.org/) — Version numbering
- [SPDX License List](https://spdx.org/licenses/) — License identifiers
- JSON Schema files: `schema/KDNA_*.schema.json`
- CLI tools: `kdna validate`, `kdna inspect`, `kdna plan-load`, `kdna load`, `kdna pack`, `kdna unpack`
