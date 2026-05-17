# KDNA Specification v0.2

**Status:** Draft
**Editors:** KDNA Team
**Repository:** https://github.com/aikdna/KDNA

## Abstract

KDNA (Knowledge DNA) is a structured format for encoding domain cognition for AI agents. This specification defines the file format, validation rules, loading behavior, and conformance requirements for KDNA domains.

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
- Skill systems needing a cognition layer separate from execution steps

KDNA is NOT designed for:
- Storing large document collections
- Replacing RAG (Retrieval-Augmented Generation)
- Replacing tool APIs or MCP servers
- Procedural automation steps
- Generic prompt collections

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

### 3.4 Manifest

A domain package SHOULD include a `kdna.json` manifest:

```json
{
  "kdna_spec": "0.2",
  "name": "<domain-id>",
  "version": "<semver>",
  "status": "experimental | basic | stable | pro",
  "access": "open | licensed | runtime",
  "language": "<ISO 639-1>",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "...", "url": "..." },
  "description": "..."
}
```

## 4. Shared Root Structure

Every KDNA JSON file MUST include a `meta` object at the root with these REQUIRED fields:

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Spec version this file conforms to (e.g., "0.2") |
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
2. Prefer `stable` > `basic` > `experimental` status
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

A conforming evaluator SHOULD test:
- Loaded vs. unloaded response quality difference
- Misunderstanding detection rate
- Terminology consistency (preferred terms used, banned terms avoided)
- Scenario trigger accuracy
- Self-check pass rate
- Axiom alignment in reasoning

The evaluation output MUST include a score and specific evidence for each dimension.

## 10. Compatibility

KDNA MAY be used with:
- Agent Skills (as a cognition layer loaded before task execution)
- MCP Resources (as structured context provided to tools)
- RAG systems (as a judgment lens for retrieved documents)
- Prompt routers (as domain-specific system prompts)
- Custom agent runtimes
- Local file-based assistants

KDNA MUST NOT replace these systems. It provides a cognition layer that operates alongside them.

## 11. Security Considerations

- KDNA files are JSON, not executable code. They MUST NOT contain active scripts.
- Domains using `licensed` or `runtime` access modes MUST be protected by the Runtime layer.
- The `kdna.json` manifest MUST NOT contain secrets or API keys.
- Loaders SHOULD validate JSON before parsing to prevent injection.

## 12. Version Compatibility

- KDNA v0.2 files are backward-compatible with v0.1 loaders for the Core+Patterns subset.
- Fields added in v0.2 (`kdna.json` manifest, `access` mode) are OPTIONAL for v0.1.
- Loaders SHOULD ignore unknown fields to enable forward compatibility.

## 13. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) — Key words for use in RFCs
- [Semantic Versioning](https://semver.org/) — Version numbering
- [SPDX License List](https://spdx.org/licenses/) — License identifiers
- JSON Schema files: `schema/KDNA_*.schema.json`
- CLI tools: `kdna validate`, `kdna pack`, `kdna eval`
- Registry: `registry/domains.json`