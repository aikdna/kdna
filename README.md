# KDNA Protocol

> [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

Maintained by **AIKDNA** — the open ecosystem for AI-native Knowledge DNA.

**Build domains, tools, integrations — not parallel protocols.**

**AI can generate knowledge. Humans still create judgment.**

The KDNA Protocol is an open format for encoding human-verified domain judgment into structured assets that AI agents can load, verify, and evolve. KDNA does not replace the model — it gives the model a domain judgment reference while it reasons and acts.

Prompts tell AI what to say. Skills tell AI what to do. MCP connects AI to tools.  
**KDNA tells AI how to judge within a domain.**

> **Version map**: SPEC `v1.0-rc` · Registry `v2.0`. See [docs/version-matrix.md](./docs/version-matrix.md).

---

## Why now

> **Agents are getting better at taking action. They still lack domain judgment.**

The current agent ecosystem has solved the "doing" problem: function calls, MCP, tool use, workflows. But doing is not judging — an agent that can do anything, but cannot distinguish a price objection from an uncertainty signal, will confidently execute the wrong action.

Tools let AI act. **KDNA keeps AI from acting blindly.**

Self-improving agents need judgment governance. Without explicit judgment, improvement becomes drift. The KDNA Protocol is the protocol for human-governed self-improvement: agents can learn from work, but judgment updates require Human Judgment Lock — critical fields like axioms, boundaries, risk models, and failure criteria cannot be modified without human confirmation.

Every domain has expert-level judgment patterns that currently exist only in experienced practitioners' minds. KDNA is a format for extracting those patterns, encoding them as machine-verifiable structures, and loading them into agents as a judgment reference — independent of prompts, independent of knowledge bases, independent of tools.

---

## Before / After KDNA

> **KDNA optimizes reasoning paths, not phrasing.**

| Without KDNA | With KDNA |
|---|---|
| Generic, knowledge-level response | Domain-specific expert judgment |
| Treats objection as literal statement | Diagnoses what's hiding behind the words |
| "Customer says too expensive → give discount" | "Price objection is an uncertainty signal → diagnose which dimension" |
| "Employee doesn't execute → motivation problem" | "Execution failure → check upstream system conditions" |
| "Elder person refuses activity → not engaging enough" | "Refusal to participate → identify invisible barriers (fear, burden, dignity threat)" |
| This is a prompt library | This is a judgment encoding format |
| Cannot be verified | Every axiom, misunderstanding, and self-check is testable |

Same model. Same input. Different judgment path.

---

## Early Benchmark Evidence

In a [5-model agent_safety mini benchmark](./benchmarks/BENCHMARK_SUMMARY.md), KDNA outperformed an equivalently-principled Best Prompt control across all 5 models.

| Configuration | MiniMax | Claude Opus 4.7 | Qwen 3.7 Max | Gemini 3.5 Flash | GPT-5.5 |
|---------------|:---:|:---:|:---:|:---:|:---:|
| No KDNA | 79 | 79 | 80 | 64 | 92 |
| Best Prompt | 104 | 104 | 101 | 94 | 99 |
| **KDNA** | **108** | **111** | **107** | **103** | **110** |
| vs Best | +4 | +7 | +6 | +9 | +11 |

**Average: +7.4 over Best Prompt, +29.0 over No KDNA.**

[Full report](./benchmarks/BENCHMARK_SUMMARY.md) · [Raw outputs](./benchmarks/raw/agent_safety/) · [Runner](./benchmarks/eval-agent-safety.mjs) · [Limitations](./benchmarks/BENCHMARK_SUMMARY.md#7-limitations--next-steps)

---

## What KDNA is — and what it is not

### KDNA is:

- A **judgment reference layer** that AI agents load before they act in a domain
- A **structured format** for axioms, concept boundaries, failure risks, self-checks, and reasoning chains
- A **human-verified encoding** — critical judgment fields require Human Judgment Lock before modification
- A **composable protocol** — multiple domain packages can be loaded together with conflict reporting

### KDNA is not:

- **Not a model or LLM.** KDNA loads alongside the model as a judgment reference. It does not generate text, reason, or predict.
- **Not a prompt library.** Prompts are task-scoped and ephemeral. KDNA is domain-scoped and version-controlled.
- **Not RAG or a knowledge base.** RAG retrieves facts. KDNA encodes what matters and what to watch for.
- **Not a workflow engine or skill.** Skills define steps. KDNA defines the judgment criteria across those steps.
- **Not fine-tuning.** Fine-tuning internalizes behavior into model weights. KDNA keeps judgment explicit, auditable, and editable.
- **Not a `.cursorrules` or project rules file.** KDNA is structured, validated, versioned, signed, and cross-agent portable.

---

## KDNA and common AI agent mechanisms

| Mechanism | What it provides | KDNA's relationship |
|-----------|-----------------|---------------------|
| **System Prompt** | Persistent behavioral instructions | KDNA provides structured, validated, domain-specific judgment that the model references during reasoning — not free-text behavioral nudges |
| **Skill / Workflow** | Steps to follow | Skills execute. KDNA shapes how the agent judges what to do at each step |
| **MCP / API** | Tool connections | MCP connects agents to tools. KDNA helps the agent judge tool outputs |
| **RAG / Knowledge base** | Facts and documents | RAG retrieves information. KDNA helps interpret what matters in that information |
| **Fine-tuning** | Internalized behavior | Fine-tuning internalizes patterns. KDNA keeps judgment explicit, auditable, and version-controlled |
| **.cursorrules / project rules** | File-level behavioral hints | KDNA is a standardized, validated, cross-agent format with signatures and registry distribution |

For a deeper comparison, see [Where KDNA fits](https://aikdna.com/docs/positioning).

---

## 30-second example

```
User: "Help me improve this product launch post."

Without KDNA:
  → Suggests clearer wording, shorter sentences, more enthusiasm.

With writing.kdna:
  → Classifies as structural writing diagnosis (not language polishing).
  → Checks: Is there a real argument? A cognitive hook? Evidence density?
  → Avoids banned terms: "polish the language", "make it punchy".
  → Self-checks: 5/5 passed. Risk flags: none.
```

The agent didn't get better at writing. It got better at *judging what kind of problem this is*.

---

## 5-Minute Quick Start

One path. Five minutes. See KDNA change an agent's judgment.

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
kdna compare @aikdna/writing --input "help me improve this post"
```

That's it. Your agent now loads a domain judgment package. The last command sends the same input to an LLM with and without KDNA, diffing the judgment paths so you can see exactly what changed.

```bash
# Verify everything is working
kdna doctor --agents

# → Codex: detected, kdna-loader installed
# → Claude Code: detected, kdna-loader installed
# → OpenCode: not detected (install opencode first)
# → KDNA data root: ~/.kdna
# → Installed domains: 1
```

Want to create your own? `kdna init my_expertise` scaffolds a minimal domain. Then `kdna validate my_expertise` checks it, and `kdna publish my_expertise` sends it to the registry.

---

## What to read next

| If you are a... | Read this |
|-----------------|-----------|
| **Developer wanting to connect KDNA to an agent** | [5-minute guide](./docs/5-minute-guide.md) |
| **Domain expert wanting to encode your judgment** | [KDNA Studio Core](https://github.com/aikdna/kdna-studio) — open-source authoring kernel |
| **Evaluator wanting to measure judgment improvement** | [Evaluation guide](./docs/evaluation.md) |
| **Enterprise evaluating private deployment** | [Enterprise guide](./docs/enterprise.md) |
| **Contributor wanting to improve KDNA itself** | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| **Curious about the full specification** | [SPEC.md](./SPEC.md) |
| **Understanding governance and safety** | [Governance](./docs/GOVERNANCE.md) · [Safety](./docs/SAFETY.md) · [Risk Policy](./docs/RISK_POLICY.md) · [KDNA Card Spec](./docs/KDNA_CARD_SPEC.md) · [Security](./docs/SECURITY.md) |
| **Browsing available domains** | [Registry](https://github.com/aikdna/kdna-registry) · [aikdna.com/domains](https://aikdna.com/domains) |
| **Reading the project roadmap** | [ROADMAP.md](./docs/ROADMAP.md) |
| **Reading in Chinese** | [中文版](./README.zh.md) |

---

## Repository Map

| Repository | Role | For |
|------------|------|-----|
| [kdna](https://github.com/aikdna/kdna) | Protocol, SPEC, core library, governance docs | Everyone |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | CLI — install, validate, verify, pack, load, trace | Developers |
| [kdna-studio](https://github.com/aikdna/kdna-studio) | Studio UI — complete authoring environment | Domain creators |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Authoring kernel — create KDNA from any app (npm) | App developers |
| [kdna-registry](https://github.com/aikdna/kdna-registry) | Domain catalog — discover, verify, distribute | Publishers, consumers |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Agent loader skill — one loader, many domains | Agent users |
| [kdna-vscode](https://github.com/aikdna/kdna-vscode) | VS Code extension — validate, preview, pack | Editor users |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Native Swift runtime — use KDNA on macOS/iOS | Swift developers |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Native Swift authoring — create KDNA on Apple platforms | Swift developers |
| [kdna-writing](https://github.com/aikdna/kdna-writing) · [decision_state](https://github.com/aikdna/kdna-decision_state) · [prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) · [agent_safety](https://github.com/aikdna/kdna-agent_safety) · [kdna_authoring](https://github.com/aikdna/kdna-authoring) · [content_strategy](https://github.com/aikdna/kdna-content_strategy) · [knowledge_management](https://github.com/aikdna/kdna-knowledge_management) · [open_source_project](https://github.com/aikdna/kdna-open_source_project) · [code_review](https://github.com/aikdna/kdna-code_review) · [animation](https://github.com/aikdna/kdna-animation) | Official domain packages (bilingual en/zh-CN for core domains, evolving eval coverage) | Domain consumers |
| [aikdna.com](https://github.com/aikdna/kdna-website) | Website source | Web contributors |

---

## Repository Scope

This repository (`aikdna/kdna`) contains:

- KDNA protocol specification
- Canonical schemas and validation rules
- Reference examples
- Benchmark definitions and reports
- Asset Card and Human Lock specifications
- Core protocol documentation

Related repositories:

- [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) — official CLI and runtime control plane
- [`aikdna/kdna-registry`](https://github.com/aikdna/kdna-registry) — public domain catalog and registry schema
- [`aikdna/kdna-studio`](https://github.com/aikdna/kdna-studio) — human-led judgment asset production
- Official domain repositories — reference KDNA domains

---

## How KDNA fits in the AI agent stack

| Mechanism | What it provides | Example |
|-----------|-----------------|---------|
| **Prompt** | What to say | "You are a helpful assistant." |
| **Skill / Workflow** | What steps to follow | "Run lint, then format, then commit." |
| **MCP / API** | What tools to call | "Call the GitHub API to create a PR." |
| **RAG / Knowledge base** | What facts to retrieve | "Here are the company's coding standards." |
| **Fine-tuning** | What behavior to internalize | Model trained on expert decisions. |
| **KDNA** | **How to judge within a domain** | "Classify whether this is a structural problem or a language problem. Apply axioms X and Y. Avoid banned term Z. Run self-checks." |

KDNA does not replace these mechanisms. It provides a judgment reference layer that operates alongside them. For a deeper comparison, see [Where KDNA fits](https://aikdna.com/docs/positioning).

---

## FAQ

<details>
<summary>Is KDNA just a fancy system prompt?</summary>

No. System prompts are free-text behavioral instructions scoped to a single conversation. KDNA is a structured, validated, version-controlled format with explicit fields (axioms, boundaries, self-checks, failure risks). KDNA packages are signed, hash-verified, and distributed through a registry — a system prompt is none of these.
</details>

<details>
<summary>Does KDNA replace the model?</summary>

No. KDNA is a judgment reference that the model loads before it reasons and acts. The model still does all the reasoning, generation, and tool use. KDNA tells the model what to pay attention to, what to avoid, and what to verify — it does not generate output.
</details>

<details>
<summary>How is KDNA different from RAG?</summary>

RAG retrieves facts and documents for the model to reference. KDNA encodes what matters and what to watch for in a domain. RAG says "here's the coding standard document." KDNA says "when reviewing code, classify whether the problem is structural or cosmetic before suggesting changes."
</details>

<details>
<summary>Can I use KDNA without coding?</summary>

Yes — start with [KDNA Studio](https://github.com/aikdna/kdna-studio) for guided domain authoring. To install and use domains with your AI agent, you only need the CLI (`npm install -g @aikdna/kdna-cli`). Creating your own domain currently requires editing JSON files, though KDNA Studio's interview mode helps non-technical experts structure their judgment without writing code.
</details>

<details>
<summary>Does KDNA work with any AI model?</summary>

KDNA is model-agnostic. The format encodes judgment as structured JSON — any agent framework that can load context before reasoning can use KDNA. Currently supported agents include Claude Code, Codex, OpenCode, Cursor, and GitHub Copilot.
</details>

<details>
<summary>What happens if I load multiple KDNA domains that conflict?</summary>

KDNA's composition mechanism detects and reports conflicts rather than silently merging incompatible principles. When domains conflict — for example, a brand domain encouraging emotional intensity while a compliance domain requires conservative wording — the agent reports the conflict rather than choosing one side.
</details>

<details>
<summary>Can AI agents modify KDNA domains?</summary>

No — not the judgment-class fields. KDNA's Human Judgment Lock requires human confirmation before axioms, boundaries, risk models, failure criteria, and other judgment-class fields can be modified. Operational fields like usage statistics can be updated automatically.
</details>

<details>
<summary>Where can I see KDNA in action?</summary>

Run `kdna compare @aikdna/writing --input "help me improve this post"` to see a side-by-side judgment path comparison. Visit [aikdna.com/benchmark](https://aikdna.com/benchmark) for evaluation data across multiple domains.
</details>

---

## Languages

[English](./README.md) · [中文](./README.zh.md)

## License

- **Code** (CLI, Studio, Registry, Skills, VS Code extension): Apache-2.0
- **Documentation, examples, and domain content**: CC-BY-4.0
See [LICENSE](LICENSE) and [LICENSE-DOCS](LICENSE-DOCS) for full terms.

## Open Standard, Not Open Identity

KDNA is open source because domain judgment should become shared infrastructure for AI agents. We welcome developers, researchers, creators, and organizations to build KDNA domains, tools, validators, loaders, and agent integrations.

However, KDNA is intended to grow as a **coherent open standard**, not as a set of fragmented renamed protocols. Forks are welcome for experimentation, but public derivative protocols must clearly identify themselves as independent and must not imply official KDNA compatibility or endorsement unless they follow the official SPEC and compatibility policy.

- [TRADEMARK.md](./TRADEMARK.md) — KDNA name and marks protection
- [COMPATIBILITY.md](./COMPATIBILITY.md) — what "KDNA-compatible" means
- [FORK_POLICY.md](./FORK_POLICY.md) — constructive forks vs protocol forks
- [GOVERNANCE.md](./docs/GOVERNANCE.md) — how the standard evolves
- [registry-policy.md](./docs/registry-policy.md) — registry governance
