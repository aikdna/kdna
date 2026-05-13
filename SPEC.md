# KDNA Specification v0.1

KDNA, short for **Knowledge DNA**, is a structured format for encoding domain cognition for AI agents.

It helps an AI agent internalize how a domain thinks: its axioms, concepts, language boundaries, scenario signals, reasoning chains, and growth path.

## 1. Scope

KDNA is designed for:

- AI agents that need stable domain judgment
- domain experts who want to package their expertise for AI use
- agent runtimes that need structured context beyond raw documents
- skill systems that need a cognition layer separate from execution steps

KDNA is not designed for:

- storing large document collections
- replacing RAG
- replacing tool APIs
- writing procedural automation steps
- acting as a generic prompt collection

## 2. Core Statement

> Skills tell AI how to do things. KDNA tells AI how to think within a domain.

## 3. Domain Directory

A domain is a folder containing KDNA files. Domain folder names should use lowercase snake_case.

## 4. File Set

| File | Required | Responsibility | Load condition |
|---|---:|---|---|
| `KDNA_Core.json` | Yes | Axioms, ontology, frameworks, causal structure, stances | Always |
| `KDNA_Patterns.json` | Yes | Terminology, banned terms, misunderstandings, self-checks | Always |
| `KDNA_Scenarios.json` | No | Scenario triggers and action orientation | Concrete situation |
| `KDNA_Cases.json` | No | Complete examples showing structure | Examples or cases requested |
| `KDNA_Reasoning.json` | No | Reasoning chains and why explanations | Why or rationale requested |
| `KDNA_Evolution.json` | No | Practice stages and measurable growth | Practice or measurement requested |

A valid minimal KDNA domain must include `KDNA_Core.json` and `KDNA_Patterns.json`.

## 5. Shared Root Structure

Every KDNA file must include a `meta` object:

```json
{
  "meta": {
    "version": "0.1",
    "domain": "communication",
    "created": "2026-04-24",
    "purpose": "Describe the purpose of this file in one sentence.",
    "load_condition": "Describe when this file should be loaded."
  }
}
```

Required meta fields: `version`, `domain`, `created`, `purpose`, `load_condition`.

## 6. Core File

`KDNA_Core.json` is the anchor of the domain.

Required top-level fields:

- `meta`
- `axioms`
- `ontology`
- `frameworks`
- `core_structure`
- `stances`

Each axiom must include `id`, `one_sentence`, `full_statement`, and `why`.

Each ontology concept should include `id`, `one_sentence`, `essence`, `boundary`, and `trigger_signal`.

Each framework should include `id`, `name`, `when_to_use`, and `steps`.

`core_structure` maps causal movement: `from -> to -> via`.

## 7. Patterns File

`KDNA_Patterns.json` defines language boundaries and common mistakes.

Required top-level fields:

- `meta`
- `terminology`
- `misunderstandings`
- `self_check`

Every banned term must include `why` and `replace_with`.

Every misunderstanding must include `wrong`, `correct`, `key_distinction`, and `why`.

Every self-check item should be answerable with yes or no.

## 8. Optional Files

### KDNA_Scenarios.json

Used when the user describes a concrete situation. It contains scenes, sub-scenarios, trap beliefs, three questions, action templates, replacement language, and expected results.

### KDNA_Cases.json

Used when examples or complete cases are requested. Cases demonstrate structure, not scripts.

### KDNA_Reasoning.json

Used when the user asks why. Each reasoning chain should include `one_sentence`, `logic`, and `so_what`.

### KDNA_Evolution.json

Used when practice, growth, level, or measurement is requested. Measurements must be observable behaviors with thresholds.

## 9. Loading Decision Tree

```text
User message
│
├─ Always load KDNA_Core.json + KDNA_Patterns.json
│
├─ Concrete situation, scene, or case?
│   └─ Load KDNA_Scenarios.json
│
├─ Example, demonstration, or full case requested?
│   └─ Load KDNA_Cases.json
│
├─ Why, rationale, principle, or logic requested?
│   └─ Load KDNA_Reasoning.json
│
└─ Practice, growth, level, or measurement requested?
    └─ Load KDNA_Evolution.json
```

Multiple conditions may be true.

## 10. Validation Requirements

Structural validation should check:

- required files exist
- each file has `meta`
- required fields exist
- IDs are unique within the domain
- cross-file references resolve
- every banned term has `why`
- every misunderstanding has `key_distinction`
- every reasoning chain has `so_what`
- every self-check item is yes/no answerable

Behavioral validation should test loaded vs unloaded response quality, misunderstanding detection rate, terminology consistency, scenario trigger accuracy, and unused or overused sections.

## 11. Compatibility

KDNA can be used with Agent Skills, MCP Resources, RAG systems, prompt routers, custom agent runtimes, local file-based assistants, and long-term memory systems.

KDNA does not replace these systems. It provides a cognition layer for them.
