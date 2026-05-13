# KDNA

**KDNA (Knowledge DNA)** is an open format for encoding **domain cognition** for AI agents.

Prompts tell AI what to say.  
Skills tell AI what to do.  
**KDNA tells AI how to think within a domain.**

KDNA is not a prompt library, not a knowledge base, and not an operating manual. It is a structured way to package the judgment layer of a domain: axioms, terminology boundaries, common misunderstandings, scenario signals, reasoning chains, and capability evolution.

## Why KDNA?

Most agent frameworks focus on tools, retrieval, workflows, or memory. KDNA focuses on **judgment**:

- What assumptions should the agent start from?
- Which concepts are central to this domain?
- Which terms should be used or avoided?
- What common misunderstandings should be detected early?
- Which scenario signals should change the agent's response strategy?
- How should the agent reason from principles to action?

## Before / After KDNA

> **KDNA does not optimize wording. It changes reasoning trajectories.**

| Without KDNA | With KDNA |
|---|---|
| Generic, knowledge-level answers | Domain-specific expert judgment |
| Treats objections as literal statements | Diagnoses the uncertainty hidden behind the words |
| "The client says it's too expensive → offer discount" | "Price objection is a certainty deficit → diagnose which dimension" |
| "The employee won't execute → motivation problem" | "Execution failure → check upstream system conditions" |
| "The elderly won't participate → make it more fun" | "Not interested → identify the invisible barrier (fear, burden, dignity threat)" |
| This is a prompt library | This is a cognition encoding format |
| Unverifiable | Each axiom, misunderstanding, and self-check is testable |

See [`docs/kdna-in-action.md`](./docs/kdna-in-action.md) for the full comparison, including five detailed cases: same input, different KDNA domains, completely different cognitive paths.

## KDNA vs Skills

| Dimension | KDNA | Skills |
|---|---|---|
| Core role | Cognition framework | Execution procedure |
| Main question | How should the agent think? | What should the agent do? |
| Activation | Loaded as domain judgment | Called for a task |
| Success signal | Better judgment, fewer domain errors | Task completion |
| Typical content | Axioms, ontology, patterns, reasoning | Steps, scripts, templates, tools |

**A Skill executes. KDNA shapes judgment.**

## KDNA and LLM Wiki

KDNA does not replace LLM Wiki — they form a pipeline:

```
raw materials  →  LLM Wiki  →  KDNA  →  Skills / Agents
```

| Layer | LLM Wiki | KDNA |
|---|---|---|
| Role | Knowledge organization | Cognition encoding |
| Output | Linked Markdown knowledge base | Domain axioms, patterns, judgment |
| Question | What does this team know? | How should an agent think about this? |
| User | Humans and agents | Agents loading domain judgment |

LLM Wiki turns raw materials into organized knowledge. KDNA distills that knowledge into the cognitive layer agents need to exercise judgment — axioms, terminology boundaries, misunderstandings, scenario signals, and reasoning chains.

KDNA does not store long-form reference material, does not copy Wiki pages, and is not a personal knowledge management tool.

> LLM Wiki turns documents into knowledge.  
> KDNA turns expertise into judgment.

See [docs/kdna-and-llm-wiki.md](./docs/kdna-and-llm-wiki.md) for a complete explanation, and [examples/from-wiki-to-kdna](./examples/from-wiki-to-kdna) for a demonstration of the pipeline.

## File System

A full KDNA domain can contain up to six files:

```text
KDNA_Core.json        # Axioms, ontology, frameworks, core causal structure, stances
KDNA_Patterns.json    # Terms, banned terms, misunderstandings, self-checks
KDNA_Scenarios.json   # Scenario triggers and action orientation
KDNA_Cases.json       # Complete cases showing structure rather than scripts
KDNA_Reasoning.json   # Reasoning chains: conclusion -> logic -> so_what
KDNA_Evolution.json   # Stages, capability layers, measurable indicators
```

Minimum valid KDNA domain:

```text
KDNA_Core.json
KDNA_Patterns.json
```

## Quick Start

```bash
git clone https://github.com/aikdna/kdna.git
cd kdna
npm install
npm run lint:examples
```

Validate a domain:

```bash
node validators/kdna-lint.js examples/communication
```

## Specs

See [SPEC.md](./SPEC.md) for the full v0.1 specification.

## Examples

| Domain | Core Insight | Language |
|--------|-------------|----------|
| [communication](./examples/communication) | State repair before content discussion | EN |
| [code_review](./examples/from-wiki-to-kdna/kdna) | Classify every comment; review intent before code | EN |
| [product_decision](./examples/product_decision) | Hypothesis validation over feature delivery | ZH |
| [sales](./examples/sales) | Price objections are certainty deficits, not price problems | EN |
| [silver_age](./examples/silver_age) | Psychological entry cost matters more than activity quality | EN |
| [management](./examples/management) | Execution failures are system outputs, not motivation failures | EN |

## Languages

- [English](./README.md)
- [中文](./README.zh.md)

## License

- Code: Apache-2.0
- Documentation and examples: CC BY 4.0
