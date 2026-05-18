# KDNA

> 🧬 **[aikdna.com](https://aikdna.com)** — Official website · [![npm](https://img.shields.io/npm/v/@aikdna/kdna)](https://www.npmjs.com/package/@aikdna/kdna) · Mirror: [@knowledge-dna/kdna](https://www.npmjs.com/package/@knowledge-dna/kdna)

**KDNA (Knowledge DNA)** is an open format for encoding **domain cognition** for AI agents.

Prompts tell AI what to say.  
Skills tell AI what to do.  
**KDNA tells AI how to think within a domain.**

KDNA is not a prompt library, not a knowledge base, and not an operating manual. It is a structured way to package the judgment layer of a domain: axioms, terminology boundaries, common misunderstandings, scenario signals, reasoning chains, and capability evolution.

> **This repository defines the KDNA protocol, schemas, validation rules, and governance.**  
> Domain-specific KDNA packages live in [separate repositories](#domain-repositories) and are listed in the [registry](./registry/domains.json).  
> To install KDNA for your agent, use [kdna-skills](https://github.com/knowledge-dna/kdna-skills).  
> To add a domain to the registry, see [docs/registry-policy.md](./docs/registry-policy.md).

## Why Now

> **Agents are getting better at calling tools. They still lack domain judgment.**

The current agent ecosystem has solved action: function calling, MCP, tool use, workflows. But action without judgment is dangerous — an agent that can do anything but cannot tell the difference between a price objection and a certainty deficit will execute the wrong actions with confidence.

Tools let AI act. **KDNA lets AI not act badly.**

Every domain has expert-level judgment patterns that currently live only in experienced practitioners' heads. KDNA is a format for extracting those patterns, encoding them in a machine-verifiable structure, and loading them into agents as a cognitive layer — separate from prompts, separate from knowledge, separate from tools.

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

**Skills encode repeatable workflows. KDNA encodes repeatable judgment patterns.**

| Dimension | Skills | KDNA |
|---|---|---|
| Core question | How to do this task? | What kind of situation is this? |
| Minimum unit | Task workflow | Judgment fork |
| Typical structure | Steps, templates, tools, output format | Signal, misread, frame, boundary, action |
| Success metric | Output stability, format consistency | Classification accuracy, misjudgment avoidance |
| Best for | Repeatable tasks | Ambiguous situations |
| Primary value | Reduce cost of re-explaining | Reduce cost of misunderstanding |

**Use Skills** when the task has a clear procedure. **Use KDNA** when the same input could mean multiple things — and getting it wrong leads to wrong action. They work together: Skills execute, KDNA judges.

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
npm i -g @aikdna/kdna
kdna --help
```

Or clone the repo:

```bash
git clone https://github.com/knowledge-dna/KDNA.git
cd KDNA
npm install
npm run lint:examples
```

Validate a domain:

```bash
node validators/kdna-lint.js examples/communication
```

## Install for Your Agent

Use **[kdna-skills](https://github.com/knowledge-dna/kdna-skills)** to install KDNA support for your agent:

```bash
curl -fsSL https://raw.githubusercontent.com/knowledge-dna/kdna-skills/main/install.sh | bash
```

Installs two skills:

| Skill | What it does |
|---|---|
| **kdna-loader** | Loads domain cognition before responding — detects domains, applies axioms, runs self-checks |
| **kdna-create** | Creates or obtains KDNA domains — interview-based creation, registry download, URL import, template scaffolding |

Supports **Codex**, **Claude Code**, **OpenCode**, **Cursor**, and **GitHub Copilot**.

## Use KDNA Locally

The installer above is the recommended path. For manual setup:

```bash
# 1. Install both skills
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
mkdir -p ~/.agents/skills/kdna-create
cp skills/kdna-create/SKILL.md ~/.agents/skills/kdna-create/SKILL.md

# 2. Create your KDNA library
mkdir -p ~/.agents/Kdna/communication_expert
cp examples/communication/KDNA_Core.json ~/.agents/Kdna/communication_expert/
cp examples/communication/KDNA_Patterns.json ~/.agents/Kdna/communication_expert/

# 3. Validate
node validators/kdna-lint.js ~/.agents/Kdna/communication_expert
```

To create your own domain, ask your agent with `kdna-create` installed, or start from the [minimal template](./templates/minimal-domain/).

## Specs

See [SPEC.md](./SPEC.md) for the full v0.1 specification.

### Try the demo

```bash
node examples/minimal-agent/agent.js
```

See the same user input produce completely different cognitive analyses with different KDNA domains loaded. No LLM required — pure cognition path comparison.

## Domain Repositories

Domain cognition packages live in separate repositories. See the [registry](./registry/domains.json) for the machine-readable index.

| Domain | Repository | Status |
|---|---|---|
| Business Growth | [kdna-business-growth](https://github.com/knowledge-dna/kdna-business-growth) | experimental |
| Communication | [kdna-communication](https://github.com/knowledge-dna/kdna-communication) | experimental |
| Sales | [kdna-sales](https://github.com/knowledge-dna/kdna-sales) | experimental |
| Management | [kdna-management](https://github.com/knowledge-dna/kdna-management) | experimental |
| Product Decision | [kdna-product-decision](https://github.com/knowledge-dna/kdna-product-decision) | experimental |

### Reference Examples

The `examples/` directory contains minimal reference implementations for testing validators and illustrating the spec. These are **not** domain content — they are spec illustrations.

| Example | Purpose |
|---------|---------|
| [communication](./examples/communication) | Reference domain for validator testing |
| [minimal-agent](./examples/minimal-agent) | Demo agent loading multiple KDNA domains |
| [from-wiki-to-kdna](./examples/from-wiki-to-kdna) | Pipeline demonstration from LLM Wiki to KDNA |

### Core Docs

| Document | Description |
|---|---|
| [SPEC.md](./SPEC.md) | Protocol specification v0.1 |
| [docs/getting-started.md](./docs/getting-started.md) | Install, create, and use KDNA ([中文](./docs/getting-started.zh.md)) |
| [docs/evaluation.md](./docs/evaluation.md) | How to test whether KDNA improves judgment ([中文](./docs/evaluation.zh.md)) |
| [docs/meta-cognition.md](./docs/meta-cognition.md) | When to use KDNA, conflict arbitration, domain composition ([中文](./docs/meta-cognition.zh.md)) |
| [docs/registry-policy.md](./docs/registry-policy.md) | Domain inclusion criteria ([中文](./docs/registry-policy.zh.md)) |
| [docs/kdna-in-action.md](./docs/kdna-in-action.md) | Five detailed before/after cases |

## Tools

| Tool | Repository | Description |
|---|---|---|
| Skills | [kdna-skills](https://github.com/knowledge-dna/kdna-skills) | Installer + kdna-loader and kdna-create skills for all major agents |

## Languages

- [English](./README.md)
- [中文](./README.zh.md) — [快速上手](./docs/getting-started.zh.md) · [编写指南](./docs/kdna-in-chinese.md) · [收录标准](./docs/registry-policy.zh.md) · [国际化](./docs/i18n.md)

## License

- Code: Apache-2.0
- Documentation and examples: CC BY 4.0
