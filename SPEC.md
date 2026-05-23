# KDNA Specification v1.0-rc

**Status:** Release Candidate  
**Previous:** v0.4 (superseded)  
**Editors:** KDNA Team  
**Repository:** https://github.com/knowledge-dna/kdna

## Abstract

KDNA (Knowledge DNA) is a structured format for encoding domain judgment for AI agents. This specification defines the file format, validation rules, loading behavior, container format (.kdna), and conformance requirements for KDNA domains.

## Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

- **Domain:** A specific area of expertise with recurring judgment patterns (e.g., sales, management, code review).
- **Domain Package:** A directory containing KDNA files conforming to this specification.
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
- A domain is a directory containing at most 6 standard KDNA files
- Minimum valid domain = `KDNA_Core.json` + `KDNA_Patterns.json`
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

The following table maps each component to its meaning and its location within a domain package:

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

A conforming validator MUST reject a domain package that contains judgment-class changes without a corresponding `accept` Human Judgment Lock.

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

## 3. Domain Package

### 3.1 Directory

A domain package MUST be a directory. The directory name SHOULD use lowercase snake_case matching `^[a-z][a-z0-9_]*$`.

A domain package SHOULD include a `kdna.json` manifest at the root. See Section 6.

### 3.2 Required Files

A conforming domain package MUST include:

| File | Responsibility | Load Condition |
|------|---------------|----------------|
| `KDNA_Core.json` | Axioms, ontology, frameworks, causal structure, stances | ALWAYS |
| `KDNA_Patterns.json` | Terminology, banned terms, misunderstandings, self-checks | ALWAYS |

A domain package that does not include both files MUST NOT be considered a valid KDNA domain.

### 3.3 Optional Files

A domain package MAY include any of the following:

| File | Responsibility | Load Condition |
|------|---------------|----------------|
| `KDNA_Scenarios.json` | Scenario triggers and action orientation | Concrete situation detected |
| `KDNA_Cases.json` | Complete examples demonstrating structure | Examples or cases requested |
| `KDNA_Reasoning.json` | Reasoning chains and why explanations | Rationale or principles requested |
| `KDNA_Evolution.json` | Practice stages and measurable growth | Practice or measurement requested |

A domain package MUST NOT include more than 6 KDNA JSON files (excluding `kdna.json`).

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

Every domain package and registry entry MUST use a consistent three-field system to separate maturity, quality, and access:

| Field | Permitted Values | Meaning |
|-------|-----------------|---------|
| `status` | `draft` \| `experimental` \| `stable` \| `deprecated` | Maturity of the domain's structure and content. `draft` = early work in progress; `experimental` = complete but not yet tested in practice; `stable` = structure frozen, content mature; `deprecated` = superseded by another domain. |
| `quality_badge` | `untested` \| `tested` \| `validated` \| `expert_reviewed` \| `production_ready` | Evidence level for the domain's judgment quality. `untested` = passes schema validation only; `tested` = has eval cases with manual verification; `validated` >= 10 eval cases with automated judgment scoring; `expert_reviewed` = externally reviewed by a domain expert; `production_ready` = validated + real-world deployment evidence. |
| `access` | `open` \| `licensed` \| `runtime` | How the domain is distributed. `open` = plaintext, freely available; `licensed` = encrypted, requires local license; `runtime` = not distributed, server-side API only. |

**Rules:**
- `status` and `quality_badge` are independent. A domain MAY be `stable` but `untested` (mature structure, no eval evidence), or `experimental` but `validated` (new domain with thorough testing).
- `quality_badge` SHOULD be stored in both the domain's `kdna.json` manifest AND the registry entry. Self-declared badges MUST be verifiable via `kdna verify --judgment`.
- `deprecated` domains MUST set `replaced_by` to the successor domain name.
- The old values `basic`, `pro`, and `reference` are retired. Previously `reference` domains SHOULD migrate to `status: stable` + `quality_badge: validated` or `expert_reviewed`.

**Minimum eval requirements by badge:**

| Badge | Minimum Eval Cases | Automated Scoring |
|-------|-------------------|-------------------|
| `untested` | 0 | N/A |
| `tested` | >= 3 | Manual verification |
| `validated` | >= 10 | `kdna verify --judgment` passes |
| `expert_reviewed` | >= 10 | External expert sign-off |
| `production_ready` | >= 10 | Deployment metrics + judgment improvement evidence |

### 3.4 Manifest

A domain package MUST include a `kdna.json` manifest with the following REQUIRED fields:

```json
{
  "kdna_spec": "1.0-rc",
  "name": "<domain-id>",
  "version": "<semver>",
  "judgment_version": "<semver>",
  "status": "draft | experimental | stable | deprecated",
  "quality_badge": "untested | tested | validated | expert_reviewed | production_ready",
  "access": "open | licensed | runtime",
  "language": "<ISO 639-1>",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "...", "url": "..." },
  "description": "..."
}
```

**Rules:**
- `judgment_version` is REQUIRED. It tracks the version of the domain's judgment content (axioms, ontology, misunderstandings). It MUST be incremented when any judgment-relevant content changes. It MAY differ from `version` which tracks packaging or metadata changes.
- `status` and `quality_badge` are independent. See §3.3.2.
- Domains claiming `quality_badge` of `tested` or higher MUST include:
  - An `evals/` directory with at least 4 case files (core, boundary, failure, excluded scenarios)
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

The `domain` field MUST be identical across all files in a domain package.

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
- `self_check` (array of strings) — See Section 6.4

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

### 6.4 Self-Checks

`self_check` MUST be an array of strings. Each item MUST be answerable with yes or no. Self-checks SHOULD test domain-specific judgment, not generic quality.

A domain SHOULD have between 2 and 6 self-check items.

## 7. Optional Files

### 7.1 Scenarios (`KDNA_Scenarios.json`)

When present, MUST include:

- `meta` (object)
- `scenes` (array)

Each scene MUST include `id`, `name`, `trigger_signal`, and `sub_scenarios`.

Each sub-scenario MUST include `id`, `trap_belief`, `three_questions` (with `belief`, `state`, `need`), `action_template`, `replace`, and `expected_result`.

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
├─ ALWAYS load KDNA_Core.json + KDNA_Patterns.json
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

1. Required files exist (`KDNA_Core.json` + `KDNA_Patterns.json`)
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

- Every domain claiming `quality_badge` of `tested` or higher MUST include an `evals/` directory with at least 4 case files
- Each eval case MUST include: `id`, `domain`, `input`, `expected_classification`, `expected_axioms`, `output_rubric`
- The 4 minimum cases SHOULD cover: core scenario (normal application), boundary scenario (domain does not apply), failure scenario (misunderstanding triggered), excluded scenario (edge case)
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
- Domains using `licensed` or `runtime` access modes MUST be protected by the Runtime layer.
- The `kdna.json` manifest MUST NOT contain secrets or API keys.
- Loaders SHOULD validate JSON before parsing to prevent injection.

## 12. Version Compatibility

- KDNA v0.4 files are backward-compatible with v0.3 loaders for the Core+Patterns subset.
- Fields added in v0.4 (cluster support, quality thresholds) are OPTIONAL for v0.3.
- Loaders SHOULD ignore unknown fields to enable forward compatibility.

### 12.1 Domain Version Semantics

KDNA domains follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH). The `kdna.json` manifest `version` field and each file's `meta.version` MUST use semver.

| Level | Increment when | Examples |
|-------|---------------|----------|
| **PATCH** (0.4.x) | Content refinement without structural change | Fix typo in axiom statement, clarify ontology boundary wording, improve self-check phrasing |
| **MINOR** (0.x.0) | New judgment structures added; no breaking changes to existing logic | Add new axiom, add ontology concept, add framework, add misunderstanding, add scenario |
| **MAJOR** (x.0.0) | Breaking changes to existing judgment logic | Remove axiom, change framework steps order, redefine concept boundary, change self-check trigger |

A domain at `v0.2.0` with only Core+Patterns is less mature than `v0.4.0` with Core+Patterns+Scenarios+Cases. The version number reflects structural evolution, not functional superiority. Two domains at different versions MAY both be valid for their respective scopes.

The SPEC version (`kdna_spec` in manifest) indicates which version of this specification the domain conforms to (e.g., `1.0-rc`). This is independent of the domain's own version number.

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

A `.kdna` file is the distribution unit for KDNA domain cognition. It is a portable, self-contained, verifiable container — not merely a ZIP of JSON files. The container format is separate from the domain package directory format: a domain package is edited as a directory; a `.kdna` container is what is distributed, installed, and verified.

### 14.1 Design Principles

1. **Self-contained:** A `.kdna` file MUST contain everything needed to install and verify a domain without external dependencies (except the CLI/loader).
2. **Verifiable:** Every `.kdna` file MUST be checksum-able and signable. The container is the unit of trust.
3. **Identity-carrying:** A `.kdna` file carries identity (name, version, author, scope) in its manifest. It is not an anonymous blob.
4. **Stable:** Once published, a specific version of a `.kdna` file MUST be immutable. Content changes produce a new container with a new version.

### 14.2 Container Format

A `.kdna` file:

- **MUST** be a ZIP archive (application/zip).
- **MUST** use the `.kdna` file extension.
- **MUST NOT** be password-protected or encrypted at the container level (encryption of licensed domains is handled separately at the content level, see §14.9).
- **MUST** use UTF-8 encoding for all text files within the archive.
- **MUST** use forward slash (`/`) as path separator within the archive.
- **SHOULD** use Deflate compression (ZIP method 8).

### 14.3 Required Contents

A valid `.kdna` container MUST contain:

| File | Required | Description |
|------|----------|-------------|
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

A container MUST NOT contain more than 6 KDNA JSON files (Core, Patterns, Scenarios, Cases, Reasoning, Evolution). Additional files such as `README.md`, `LICENSE`, `signature.json`, and `evals/` are not counted toward this limit.

### 14.4 Container Manifest (`kdna.json`)

Every `.kdna` container MUST include a `kdna.json` at the archive root. This file declares the container's identity, version, and verification metadata.

```json
{
  "format": "kdna",
  "format_version": "1.0",
  "name": "@aikdna/writing",
  "version": "0.7.2",
  "judgment_version": "2026.05",
  "spec_version": "1.0-rc",
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
  "access": "open",
  "language": "en",
  "keywords": ["writing", "editing", "editorial"],
  "file_count": 6,
  "created": "2026-05-01",
  "updated": "2026-05-15",
  "container_sha256": "abc123...",
  "signature": "ed25519:def456..."
}
```

**Required fields:** `format`, `format_version`, `name`, `version`, `spec_version`, `description`, `author`, `access`.

**Optional fields:** `judgment_version`, `core_insight`, `license`, `status`, `quality_badge`, `language`, `keywords`, `file_count`, `created`, `updated`, `container_sha256`, `signature`.

The `name` field follows the format `@scope/domain-name` and MUST match the registry entry.

### 14.5 Checksum

- **Container checksum:** The `container_sha256` field in `kdna.json` is the SHA-256 hash of the complete `.kdna` file (the ZIP archive bytes).
- **Content checksum:** The registry entry `sha256` matches the container checksum.
- Checksums MUST be verified during `kdna install` before unpacking.
- Checksum verification MUST fail closed: any mismatch prevents installation.

### 14.6 Signing

A `.kdna` container MAY be signed using Ed25519.

- The signature covers the **content tree** (all files within the archive, sorted by path, excluding `signature.json` itself).
- The signing key corresponds to the scope's `trust_pubkey` in the registry.
- The signature is stored in `signature.json` within the container:
  ```json
  {
    "algorithm": "ed25519",
    "public_key": "ed25519:43d22af8f0e189b6fd42bfaab710f52f4bc5f0ae3f5e04719a1a1d9ce9760fbe",
    "signature": "base64-encoded-signature",
    "signed_at": "2026-05-15T10:00:00Z"
  }
  ```
- Signature verification is REQUIRED for domains with `access: licensed` or `access: runtime`.
- Signature verification is RECOMMENDED for domains with `access: open`.

### 14.7 Unpack Behavior

When a `.kdna` file is installed via `kdna install` or `kdna unpack`:

1. Verify container checksum (if available in registry).
2. Verify signature (if `signature.json` is present).
3. Extract to `~/.kdna/domains/@scope/name/`.
4. Validate structural compliance (kdna-lint + kdna-validate).
5. Register in the local domain index.

The unpack target directory name is derived from the domain's `name` in `kdna.json`:
- `@aikdna/writing` → `~/.kdna/domains/@aikdna/writing/`

### 14.8 CLI Operations on Containers

| Command | Operation |
|---------|-----------|
| `kdna pack ./writing` | Create `writing.kdna` from a domain directory |
| `kdna unpack writing.kdna` | Extract container to a directory |
| `kdna install @aikdna/writing` | Download from registry, verify, and unpack |
| `kdna inspect writing.kdna` | Display container metadata without unpacking |
| `kdna verify writing.kdna` | Verify checksum and signature without unpacking |
| `kdna install ./writing.kdna` | Install from a local container file |

### 14.9 Platform Recognition

For operating system-level recognition of `.kdna` files:

| Platform | Mechanism |
|----------|-----------|
| **macOS** | UTType: `com.aikdna.kdna` (or `public.kdna`). Registered by KDNAChat Mac App. Double-click opens in KDNAChat for inspection and installation. |
| **Windows** | File extension association with KDNAChat or CLI. |
| **Linux** | MIME type `application/x-kdna`. Desktop file association. |

The recommended MIME type is `application/x-kdna`.

### 14.10 Container vs Directory

| | Domain Directory | .kdna Container |
|---|---|---|
| **Purpose** | Authoring and editing | Distribution and installation |
| **Location** | Any filesystem path | `~/.kdna/domains/@scope/name/` (after unpack) |
| **Verifiable** | Via `kdna validate` | Via `kdna verify` + checksum + signature |
| **Immutable** | No | Yes (once published) |
| **Directly Loadable** | Yes | No (must be unpacked first) |

Domain authors work in directories. Users and agents receive `.kdna` containers. The container is the distribution primitive; the directory is the working copy.

---

## 15. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) — Key words for use in RFCs
- [Semantic Versioning](https://semver.org/) — Version numbering
- [SPDX License List](https://spdx.org/licenses/) — License identifiers
- JSON Schema files: `schema/KDNA_*.schema.json`
- CLI tools: `kdna validate`, `kdna pack`, `kdna compare`
- Registry: `registry/domains.json`