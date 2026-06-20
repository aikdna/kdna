# KDNA Specification v1.0-rc

**Status:** Release Candidate  
**Previous:** v0.4 (superseded)  
**Editors:** KDNA Team  
**Repository:** https://github.com/aikdna/kdna

## Abstract

KDNA (Knowledge DNA) is a structured asset format for encoding domain judgment for AI agents. A `.kdna` asset represents one scoped judgment domain; complex agent work MAY route and compose multiple `.kdna` assets into KDNA Clusters. This specification defines the `.kdna` asset format, internal file tree, validation rules, loading behavior, and conformance requirements for KDNA domains and their composition layer.

## Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

- **Domain:** A specific area of expertise with recurring judgment patterns (e.g., sales, management, code review).
- **KDNA Asset:** A `.kdna` file representing one portable, installable, verifiable, and loadable domain judgment asset. A valid KDNA asset MUST contain `payload.kdnab` (CBOR-encoded judgment). It MUST NOT contain `KDNA_Core.json`, `KDNA_Patterns.json`, `KDNA_Scenarios.json`, `KDNA_Cases.json`, `KDNA_Reasoning.json`, or `KDNA_Evolution.json` as top-level ZIP entries. Those files belong to the source tree only.
- **Internal Domain Tree:** The content encoded inside `payload.kdnab`. This is not human-readable directly; consumption requires KDNA-compatible tooling. The source tree (KDNA_Core.json etc.) is the authoring format, never distributed as an asset.
- **Dev Source Directory:** An optional authoring workspace used to build a `.kdna` asset. Source directories are non-canonical and MUST NOT be treated as installed runtime domains.
- **Loader:** Software that reads KDNA files and formats them for agent consumption.
- **Validator:** Software that checks KDNA files for structural compliance.
- **Registry:** A machine-readable index of available KDNA domains.

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

KDNA is a *judgment structure format*, not a general content format. The following boundaries are defined to prevent format dilution:

**Invariant (MUST NOT change across versions):**
- A KDNA domain is represented by one `.kdna` asset containing at most 6 standard KDNA judgment files; supporting entries such as `kdna.json`, `README.md`, `LICENSE`, `signature.json`, `evals/`, `examples/`, and `reports/` do not count toward this limit
- Minimum valid domain = `KDNA_Core.json` + `KDNA_Patterns.json` in the SOURCE TREE. In the distribution asset, the minimum is `kdna.json` + `payload.kdnab`.
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

The following table maps each component to its meaning and its location within the internal tree of a `.kdna` asset:

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
| `atomspeak` as a single 800-line `KDNA_Core.json` | `atomspeak` (single question) + sub-domain `state_quadrant` only if independently loadable; otherwise `internal_module` |

This principle is enforced by lint, not by prose. The canonical implementation lives in `aikdna/kdna-cli` (`src/cmds/anti-monolithic.js`); the principle text originates in RFC-0013 §4.

## 1.7. Judgment Update Governance

KDNA domains encode judgment standards. When a self-improving agent learns from work, not all learning is equal. This section defines which updates agents MAY apply automatically and which MUST receive Human Judgment Lock.

### 1.7.1. Three Classes of Updates

| Class | Auto-Apply? | Examples |
|-------|-------------|----------|
| **Operational** | Yes | Tool call parameters, API formats, output formatting preferences, project-specific commands |
| **Evidence** | Record only | New outcome records, eval failures, trace anomalies, user feedback |
| **Judgment** | **No** | Axioms, value order, boundaries, risk models, composition policy |

Operational updates improve execution without changing what the agent considers correct. Evidence updates provide raw material for future proposals but do not modify judgment standards. Judgment updates change what the agent holds to be true, valuable, or risky — these MUST enter governance.

### 1.7.2. Fields Requiring Human Judgment Lock

The following MUST NOT be modified without a recorded Human Judgment Lock in `KDNA_Evolution.json`:

- `axioms` — any addition, removal, or revision
- `value_order` — any reorder, addition, or removal
- `judgment_role` — any change
- `boundaries` — any change to what must not be done
- `risk_model` — any change to which errors cost the most
- `does_not_apply_when` — any change to applicability conditions
- `failure_risk` — any change to stated risks
- `composition.policy.json` — any change to domain composition rules

A conforming validator MUST reject a `.kdna` asset that contains judgment-class changes without a corresponding `accept` Human Judgment Lock.

### 1.7.3. Human Judgment Lock Format

A Human Judgment Lock is an entry in `KDNA_Evolution.json` under `human_locks`:

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

The internal tree of a `.kdna` container is encoded in `payload.kdnab` (CBOR). Source trees (KDNA_Core.json, KDNA_Patterns.json, etc.) are authoring workspaces only and MUST NOT appear as top-level entries in a distribution `.kdna` asset. See `specs/container.md`.

A `.kdna` asset MUST include a `kdna.json` manifest at the archive root.

### 3.2 Required Entries (Distribution Asset)

A conforming distribution `.kdna` asset MUST include:

| Entry | Description |
|-------|-------------|
| `kdna.json` | Public manifest and metadata (no judgment content) |
| `payload.kdnab` | CBOR-encoded judgment payload (all domain content) |
| `signature.kdsig` | Ed25519 signature over canonical payload digest |

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

#### 3.3.2 Three-Field System

Every `.kdna` asset and registry entry MUST use a consistent three-field system to separate maturity, quality, and access:

| Field | Permitted Values | Meaning |
|-------|-----------------|---------|
| `status` | `draft` \| `experimental` \| `stable` \| `deprecated` | Maturity of the domain's structure and content. `draft` = early work in progress; `experimental` = complete but not yet tested in practice; `stable` = structure frozen, content mature; `deprecated` = superseded by another domain. |
| `quality_badge` | `untested` \| `tested` \| `validated` \| `expert_reviewed` \| `production_ready` | Evidence level for the domain's judgment quality. `untested` = passes schema validation only; `tested` = >= 10 eval cases with manual verification; `validated` = >= 30 eval cases with automated judgment scoring; `expert_reviewed` = externally reviewed by a domain expert; `production_ready` = validated + real-world deployment evidence. |
| `access` | `public` \| `licensed` \| `remote` | How the domain is distributed. `public` = freely usable by any KDNA-compatible runtime; `licensed` = encrypted, requires local license; `remote` = not distributed, consumed through API/MCP. |

**Rules:**
- `status` and `quality_badge` are independent. A domain MAY be `stable` but `untested` (mature structure, no eval evidence), or `experimental` but `validated` (new domain with thorough testing).
- `quality_badge` SHOULD be stored in both the domain's `kdna.json` manifest AND the registry entry. Self-declared badges MUST be verifiable via `kdna verify --judgment`.
- `deprecated` domains MUST set `replaced_by` to the successor domain name.
- The old values `basic`, `pro`, and `reference` are retired. Previously `reference` domains SHOULD migrate to `status: stable` + `quality_badge: validated` or `expert_reviewed`.

**Minimum eval requirements by badge:**

| Badge | Minimum Eval Cases | Automated Scoring |
|-------|-------------------|-------------------|
| `untested` | 0 | N/A |
| `tested` | >= 10 | Manual verification |
| `validated` | >= 30 | `kdna verify --judgment` passes |
| `expert_reviewed` | >= 30 | External expert sign-off |
| `production_ready` | >= 30 | Deployment metrics + judgment improvement evidence |

### 3.4 Manifest

A `.kdna` asset MUST include a `kdna.json` manifest with the following REQUIRED fields:

```json
{
  "format": "kdna",
  "format_version": "2.0",
  "spec_version": "2.0",
  "name": "<domain-id>",
  "version": "<semver>",
  "judgment_version": "<semver>",
  "status": "draft | experimental | stable | deprecated",
  "quality_badge": "untested | tested | validated | expert_reviewed | production_ready",
  "access": "public | licensed | remote",
  "languages": ["<BCP 47>"],
  "default_language": "<BCP 47>",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "...", "url": "..." },
  "description": "...",
  "container": {
    "type": "kdna-container-v2",
    "payload": "payload.kdnab",
    "payload_encoding": "cbor"
  }
}
```

**Rules:**
- `spec_version` is REQUIRED. It declares which KDNA specification version this asset conforms to. `kdna_spec` is rejected.
- `format` MUST be `"kdna"` and `format_version` MUST be `"2.0"`.
- `container.type` MUST be `"kdna-container-v2"`. `container.payload` MUST be `"payload.kdnab"`.
- `judgment_version` is REQUIRED. It tracks the version of the domain's judgment content (axioms, ontology, misunderstandings). It MUST be incremented when any judgment-relevant content changes. It MAY differ from `version` which tracks packaging or metadata changes.
- `status` and `quality_badge` are independent. See §3.3.2.
- Domains claiming `quality_badge` of `tested` or higher MUST include:
  - An `evals/` directory with at least 10 case files (core, boundary, failure, excluded scenarios)
  - A README.md with explicit boundary declaration (Scope + Out-of-Scope, or v2.1 Four Questions format)

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

When multiple domains are available, the loader SHOULD:
1. Match user input keywords against domain `kdna.json` keywords
2. Prefer `stable` > `experimental` > `draft` status
3. Load one domain as leader, others as constraints
4. NOT load a domain if its boundary declaration conflicts with the task

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

### 9.2 Behavioral Validation

A conforming evaluator MUST test behavioral quality via the `evals/` directory:

- Every domain claiming `quality_badge` of `tested` or higher MUST include an `evals/` directory with at least 10 case files
- Each eval case MUST include: `id`, `domain`, `input`, `expected_classification`, `expected_axioms`, `output_rubric`
- The 10 minimum cases SHOULD cover multiple: core scenarios (normal application), boundary scenarios (domain does not apply), failure scenarios (misunderstanding triggered), excluded scenarios (edge cases)
- A conforming evaluator SHOULD also test:
  - Loaded vs. unloaded response quality difference
  - Misunderstanding detection rate
  - Terminology consistency (preferred terms used, banned terms avoided)
  - Scenario trigger accuracy
  - Self-check pass rate
  - Axiom alignment in reasoning

The evaluation output MUST include a score and specific evidence for each dimension.

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

## 12. Version Policy

- KDNA v1.0 tools implement the v1.0 schema and media type.
- Pre-v1.0 aliases and package layouts are not part of the open protocol.
- Loaders MUST reject manifest fields that are not defined by the active schema.

### 12.1 Domain Version Semantics

KDNA domains follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH). The `kdna.json` manifest `version` field and each file's `meta.version` MUST use semver.

| Level | Increment when | Examples |
|-------|---------------|----------|
| **PATCH** (0.4.x) | Content refinement without structural change | Fix typo in axiom statement, clarify ontology boundary wording, improve self-check phrasing |
| **MINOR** (0.x.0) | New judgment structures added; no breaking changes to existing logic | Add new axiom, add ontology concept, add framework, add misunderstanding, add scenario |
| **MAJOR** (x.0.0) | Breaking changes to existing judgment logic | Remove axiom, change framework steps order, redefine concept boundary, change self-check trigger |

A domain at `v0.2.0` with only Core+Patterns is less mature than `v0.4.0` with Core+Patterns+Scenarios+Cases. The version number reflects structural evolution, not functional superiority. Two domains at different versions MAY both be valid for their respective scopes.

The SPEC version (`spec_version` in manifest) indicates which version of this specification the domain conforms to (e.g., `2.0`). This is independent of the domain's own version number.

## 13. Domain Composition and Clusters

KDNA domains MAY be composed into clusters to handle multi-faceted judgment tasks. A cluster is a composable judgment system — not a merged domain, but a coordinated assembly of independent domains with explicit composition rules.

### 13.1 Conceptual Model

```
Judgment Atom    = Domain (single KDNA package, 2–6 files)
Judgment Cluster = Composable system of domains with composition policy
Judgment System  = Enterprise-level governance over one or more clusters
```

A domain encodes the judgment of a single expert or domain. A cluster encodes how multiple domains interact. A judgment system encodes organizational governance over clusters — who maintains what, what overrides what, and how conflicts are resolved.

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

A valid `.kdna` container MUST contain:

| File | Required | Description |
|------|----------|-------------|
| `mimetype` | REQUIRED | Fixed media type marker. Content MUST be `application/vnd.aikdna.kdna+zip` with no trailing newline. |
| `kdna.json` | REQUIRED | Container manifest (see §14.4) |
| `KDNA_Core.json` | REQUIRED | Domain core: axioms, ontology, frameworks, stances |
| `KDNA_Patterns.json` | REQUIRED | Domain patterns: terminology, misunderstandings, self-checks |
| `KDNA_Scenarios.json` | OPTIONAL | Scenario signals and action triggers |
| `KDNA_Cases.json` | OPTIONAL | Full cases demonstrating judgment application |
| `KDNA_Reasoning.json` | OPTIONAL | Reasoning chains from principle to action |
| `KDNA_Evolution.json` | OPTIONAL | Growth stages, capability layers, measurement |
| `README.md` | OPTIONAL | Human-readable domain documentation |
| `LICENSE` | OPTIONAL | License text file |
| `evals/` | OPTIONAL | Evaluation test cases directory |
| `signature.json` | RECOMMENDED | Ed25519 signature covering content (see §14.7) |

A container MUST NOT contain more than 6 KDNA JSON files (Core, Patterns, Scenarios, Cases, Reasoning, Evolution). Additional files such as `kdna.json`, `README.md`, `LICENSE`, `signature.json`, and `evals/` are not counted toward this limit.

The `mimetype` entry MUST be located at the ZIP root. Writers SHOULD store it as
the first ZIP entry and SHOULD NOT compress it. Loaders MUST check both
`mimetype` and `kdna.json`; a `.kdna` extension alone is not sufficient to treat
an archive as a valid KDNA asset.

### 14.4 Container Manifest (`kdna.json`)

Every `.kdna` container MUST include a `kdna.json` at the archive root. This file declares the container's identity, version, and verification metadata.

```json
{
  "format": "kdna",
  "format_version": "2.0",
  "spec_version": "2.0",
  "name": "@aikdna/writing",
  "version": "0.7.2",
  "judgment_version": "2026.05",
  "description": "Editorial writing judgment — diagnose whether content has a real argument, a cognitive hook, and evidence density.",
  "core_insight": "Most writing problems are structural and argument-level, not language-level.",
  "author": {
    "name": "KDNA Team",
    "id": "kdna-team",
    "pubkey": "ed25519:43d22af8f0e189b6fd42bfaab710f52f4bc5f0ae3f5e04719a1a1d9ce9760fbe"
  },
  "license": {
    "type": "CC-BY-4.0"
  },
  "status": "experimental",
  "quality_badge": "tested",
  "access": "public",
  "languages": ["en", "zh-CN"],
  "default_language": "en",
  "keywords": ["writing", "editing", "editorial"],
  "file_count": 6,
  "created": "2026-05-01",
  "updated": "2026-05-15",
  "content_digest": "sha256:abc123...",
  "signature": "ed25519:def456...",
  "source_mode": "blank",
  "creator": {
    "creator_id": "kdna:creator:ed25519:8f3a...",
    "display_name": "Zhang Ling",
    "public_key": "-----BEGIN PUBLIC KEY-----...",
    "verified": false
  },
  "lineage": {
    "type": "original"
  }
}
```

**Required fields:** `format`, `format_version`, `spec_version`, `name`, `version`, `judgment_version`, `description`, `author`, `license`, `status`, `quality_badge`, `access`, `languages`, `default_language`.

**Strongly recommended:** `source_mode`. Assets without `source_mode` default to `"blank"` in conforming validators.

**Optional fields:** `core_insight`, `keywords`, `file_count`, `risk_level`, `privacy_level`, `asset_type`, `created`, `updated`, `content_digest`, `signature`, `fitness_for_purpose`, `creator`, `lineage`.

The `name` field follows the format `@scope/domain-name`. This is a structural naming convention; it does not require registration in any registry. The `kdna_spec` field is not part of v1.0 and MUST be rejected.

#### 14.4.1 Source Mode

`source_mode` declares how this domain was originally created:

| Value | Description |
|-------|-------------|
| `"blank"` | Created from scratch in Studio (original creation) |
| `"kdna_asset"` | Forked or adapted from an existing `.kdna` asset |
| `"source_folder"` | Migrated from a legacy JSON source folder |

Assets with `source_mode: "kdna_asset"` SHOULD include a `lineage` record documenting the parent asset. Assets with `source_mode: "source_folder"` MUST be treated as untrusted until re-locked through a Studio-compatible pipeline.

#### 14.4.2 Creator Identity

`creator` records the local creator identity of the human who authored this domain:

| Field | Type | Description |
|-------|------|-------------|
| `creator_id` | string | Unique creator identifier: `"kdna:creator:ed25519:<fingerprint>"` |
| `display_name` | string | Human-readable name |
| `public_key` | string | Ed25519 public key (PEM) |
| `verified` | boolean | Whether this identity is bound to a verified account |

The creator identity is generated locally and does not require registration. The `creator_id` is derived from the SHA-256 fingerprint of the creator's Ed25519 public key.

#### 14.4.3 Lineage

`lineage` documents the derivation history when an asset is not an original creation:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"original"`, `"fork"`, `"adapt"`, or `"migrated"` |
| `parent_name` | string | Name of the parent KDNA asset |
| `parent_asset_uid` | string | Asset UID of the parent |
| `parent_version` | string | Version of the parent at time of fork |
| `parent_asset_digest` | string | Digest of the parent .kdna asset |

Trust is NOT inherited through lineage. Forked or adapted assets MUST go through their own Human Lock and export pipeline. Imported domain folders (migrated) MUST be re-locked before export.

### 14.5 Digest

- **Asset digest:** `asset_digest` is the SHA-256 hash of the complete `.kdna` file bytes. It MUST be recorded outside the container, such as in the registry entry, local receipt, or lockfile.
- **Content digest:** `content_digest` is the canonical SHA-256 hash of the internal content tree. The content tree includes all non-directory ZIP entries except `signature.json`, `.DS_Store`, `build-receipt.json`, `reports/*`, and local installation metadata. Reports and build receipts are build evidence, not judgment content — they are not part of the content digest. If stored in `kdna.json`, the `content_digest` field itself (and other self-referencing digest fields) are excluded from its own digest calculation.
- Registries MUST use `asset_digest` for every installable `.kdna` asset and MAY also publish `content_digest`.
- Installers MUST verify `asset_digest` before registration.
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
- A specific registry or platform MAY require signatures for assets listed there; such requirements are registry policy, not KDNA Core format rules.

### 14.6.2 Publish Audit

Registry entries for trusted assets SHOULD include a  block:

| Field | Type | Description |
|-------|------|-------------|
|  | string | Identity of the publisher |
|  | string | ISO 8601 timestamp of publication |
|  | string | Tool chain used (e.g. "kdna-studio-cli v0.2.0 + kdna-studio-core v1.4.2") |
|  | string | Human-readable note about what changed |

### 14.6.1 Registry Trust Metadata

Conforming public registries MUST publish trust metadata alongside domain entries:

```json
{
  "schema_version": "3.0",
  "registry_version": "3.0.0",
  "updated": "ISO-8601 timestamp",
  "trust": {
    "model": "kdna-registry-v1",
    "root": { "threshold": 1, "keys": [] },
    "targets": { "threshold": 1, "delegated_scopes": ["@aikdna"] },
    "snapshot": {
      "registry_version": "3.0.0",
      "generated_at": "ISO-8601 timestamp",
      "expires_at": "ISO-8601 timestamp"
    },
    "timestamp": {
      "generated_at": "ISO-8601 timestamp",
      "expires_at": "ISO-8601 timestamp"
    },
    "revocations": []
  }
}
```

Installers MUST reject registries whose `snapshot.expires_at` or `timestamp.expires_at` is expired. Installers MUST reject assets matched by a registry revocation entry. Revocation entries SHOULD include `name`, `version`, `asset_digest`, `reason`, and `revoked_at`.

### 14.7 Install and Load Behavior

When a `.kdna` file is installed via `kdna install`:

1. Verify registry trust metadata.
2. Verify asset digest.
3. Verify signature for registry-installed assets.
4. Store the original `.kdna` file as an immutable local asset.
5. Write a local `receipt.json` containing source, `asset_digest`, `content_digest`, signature status, access mode, and install time.
6. Register the asset in the local package index.
7. Load runtime content from the `.kdna` asset.

Installation metadata MUST be stored outside the container, for example in a local index and receipt. Installers MUST NOT rewrite `kdna.json` inside the container to stamp `_source`, install time, or registry metadata.

Persistent extraction MUST NOT be required for loading. A runtime MAY create internal temporary caches, but those caches are rebuildable, hidden implementation artifacts and MUST NOT become the trust source.

### 14.8 CLI Operations on Containers

| Command | Operation |
|---------|-----------|
| `kdna install @aikdna/writing` | Download from registry, verify, store, and register a `.kdna` asset |
| `kdna install writing.kdna` | Install from a local `.kdna` asset |
| `kdna inspect writing.kdna` | Display container metadata without persistent extraction |
| `kdna verify writing.kdna` | Verify checksum, structure, judgment, and signature without persistent extraction |
| `kdna load @aikdna/writing` | Load the installed `.kdna` asset directly into agent context |
| `kdna load writing.kdna` | Load a local `.kdna` asset directly into agent context |
| `kdna compare writing.kdna --input "..."` | Compare with/without a local `.kdna` asset |
| `kdna dev pack ./writing-source` | Build a dev-only non-trusted diagnostic bundle from a non-canonical source directory. For trusted assets, use `kdna-studio migrate`. |
| `kdna dev unpack writing.kdna` | Unpack into a dev source directory for inspection or editing |

### 14.9 Platform Recognition

For operating system-level recognition of `.kdna` files:

| Platform | Mechanism |
|----------|-----------|
| **macOS** | UTType: `com.aikdna.kdna` (or `public.kdna`). Registered by a KDNA-compatible client Mac App. Double-click opens in a KDNA-compatible client for inspection and installation. |
| **Windows** | File extension association with a KDNA-compatible client or CLI. |
| **Linux** | MIME type `application/vnd.aikdna.kdna+zip`. Desktop file association. |

The recommended media type is `application/vnd.aikdna.kdna+zip`.
`application/x-kdna` is not a KDNA v1.0 media type and MUST be rejected in
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

Domain authors MAY work in directories. Users and agents MUST consume `.kdna` assets. The `.kdna` asset is the real object; the directory is a temporary source representation.

A `.kdna` asset can be created through multiple paths. The recommended path is the official Studio-compatible pipeline, which can include human confirmation, validation, canonicalization, identity generation, digest computation, optional signing, optional encryption, and provenance recording. A `.kdna` file created directly by an agent through the official SDK and validated by `kdna validate` is equally valid.

---

## 15. Authoring Paths

### 15.1 Creation Paths

A `.kdna` asset is a **structurally valid file container**. Multiple creation paths are valid:

| Path | Description |
|---|---|
| **Official toolchain** | Studio Core / CLI / MCP / SDK — recommended creation and validation path |
| **Agent-authored** | AI agent creates `.kdna` via SDK or by generating spec-compliant JSON, validated by `kdna validate` |
| **Human-authored** | Domain expert authors source files manually or via Studio, validated by official toolchain |
| **Hybrid** | Agent proposes judgment content; human reviews and confirms; toolchain validates |
| **Third-party compatible** | Any tool that produces a spec-compliant `.kdna` file and passes official validator |

A `.kdna` file is valid if it passes `kdna validate` — regardless of creation path, author identity, signature presence, or Human Lock status.

### 15.2 Recommended Creation: Official Toolchain

The official KDNA toolchain (Studio Core + CLI + SDK) is the **recommended** creation path. It provides:
- Guided authoring with judgment cards
- Automated validation and cross-file consistency checks
- Compilation, digest computation, and provenance metadata
- Optional Human Lock, signing, and encryption

Agent and third-party tools SHOULD use the official SDK or CLI to validate their output. Direct JSON hand-assembly is a valid dev path but is error-prone without validation.

### 15.3 Official Toolchain Metadata

Assets created through Studio Core MAY include additional metadata fields:

- `kdna.json` provenance: `authoring.created_by`, `authoring.compiler`, `authoring.compiler_version`, `authoring.project_uid`, `authoring.asset_uid`, `authoring.build_id`, `authoring.content_digest`
- `KDNA_CARD.json`: risk level, intended use, out-of-scope, known limitations, review status
- `reports/`: build report, provenance report, human-lock report, quality-gate report, and eval report

These metadata files are informational and do NOT alter the domain's judgment content. A loader MAY ignore them.

### 15.4 No Parallel Dialect

Studio Core MUST NOT create a parallel KDNA dialect. The canonical domain structure defined in this specification (§7) is the sole authority. Studio Core is an authoring tool, not a spec extension.

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

Reference assets published through the official toolchain SHOULD achieve at least L1 in en + zh-CN as a quality practice. This is a publishing recommendation, not a format-validity requirement.

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

### 16.6 Registry Declaration

Registry entries for localized domains MUST include:

```json
{
  "languages": ["en", "zh-CN"],
  "default_language": "en",
  "i18n_level": "L2",
  "localized": {
    "en": { "display_name": "...", "description": "..." },
    "zh-CN": { "display_name": "...", "description": "..." }
  }
}
```

### 16.7 Validation

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
- CLI tools: `kdna dev validate`, `kdna dev pack`, `kdna compare`, `kdna-studio migrate`
- Registry: `registry/domains.json`
