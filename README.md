# KDNA — The Open Judgment Standard for AI Agents

> **Loading, composing, measuring, and trusting human judgment in agent workflows.**
>
> [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

Maintained by **AIKDNA** — the open ecosystem for the KDNA Protocol.

**Build domains, tools, integrations — not parallel protocols.**

## Start Here

KDNA v1.0-rc has five public paths:

| You are | Start here | Success definition |
| --- | --- | --- |
| AI user | [5-minute guide](./docs/5-minute-guide.md) | See with/without KDNA judgment difference. |
| Domain expert | [First domain walkthrough](./docs/first-domain-walkthrough.md) | Create and verify a first `.kdna` asset. |
| Developer | [CLI JSON contract](./docs/cli-json-contract.md) | Load and verify KDNA with stable machine output. |
| Agent builder | [Agent integration kit](./docs/agent-integration-kit.md) | Show loaded-domain trace in an agent runtime. |
| Registry operator | [Private registry demo](./examples/private-registry/README.md) | Run a registry that fails closed on trust errors. |

Current public release status: [State of KDNA](./STATE_OF_KDNA.md).

KDNA is an open protocol for encoding domain judgment as structured, agent-loadable assets. It turns human-governed principles, boundaries, standards, and taste into portable `.kdna` files that AI agents can load, verify, compose, and evolve.

> **Like a .doc carries a portion of knowledge, a .kdna file carries a portion of judgment — principles, boundaries, standards, and taste — for a specific domain.**

A single `.kdna` asset represents one scoped judgment domain. Complex agent work can route and compose multiple `.kdna` assets into a KDNA Cluster, instead of flattening different judgment domains into one broad file.

Prompt changes what AI says. RAG changes what AI can access. Tools change what AI can do.  
**KDNA changes how AI judges within a domain.**

> **Skill + KDNA** — Skills make agents capable. KDNA gives them judgment, taste, and standards. [Learn more →](./docs/kdna-and-ai-stack.md#4-kdna-vs-skill)

## KDNA in 30 seconds

KDNA is a file-based judgment framework that AI agents can load as a domain reference. It is not human judgment itself — like a .doc carries a portion of knowledge, a .kdna encodes a bounded set of domain-specific principles, boundaries, standards, and taste.

It does not make an agent role-play an expert. It gives the agent an explicit framework to work within.

- **Prompt** changes what AI says.
- **RAG** changes what AI can access.
- **Tools/Skills** change what AI can do.
- **KDNA** changes how AI judges.

## KDNA Ecosystem

```
Source / Evidence
notes · docs · works · interviews · feedback
        │
        ▼
Authoring pipeline
declare domain → distill candidates → Human Lock → compile
        │
        ▼
Domain KDNA
one scoped .kdna judgment asset
        │
        ▼
Cluster / Route Policy
compose multiple domain assets when the task needs more than one judgment lens
        │
        ▼
Runtime Load
Compatible clients · CLI · MCP · SDK · Agent adapters
        │
        ▼
Trace / Review / Feedback
record which judgment was used, what passed, what should evolve
        │
        ▼
KDNA Evolution
revise · test · sign · publish
```

`Work Pack = KDNA or KDNA Cluster + Skill + Template + Review Gate + Risk Policy`.

> **KDNA Work Pack** is an open packaging standard for reusable AI work capabilities. It combines KDNA judgment with skills, review gates, risk policies, and traces so agents can perform real work with explicit domain judgment. See [kdna-workpack](https://github.com/aikdna/kdna-workpack).

> **KDNA is not a single app — it is an open protocol ecosystem for judgment assets.**
> Studio creates and compiles domain KDNA, CLI verifies and runs KDNA, Registry distributes trusted KDNA, runtime routers compose clusters, and agents load the right judgment for the task.

## Phase 2 — From Judgment Asset to Trusted Product

KDNA v1.0-rc defined how judgment is encoded. **Phase 2** defines how judgment flows into real work:

| Component | RFC | What it solves |
|-----------|-----|----------------|
| **Artifact Contract** | [RFC-0009](./specs/artifact-contract.md) | Standard envelope for any KDNA-governed output — identity, provenance, quality, trace, review |
| **Fidelity Protocol** | [RFC-0010](./specs/fidelity-protocol.md) | Measures whether judgment actually transferred into the final artifact — blind A/B/C comparison with calibration anchors |
| **WorkPack Pipeline** | [kdna-workpack](https://github.com/aikdna/kdna-workpack) | Multi-stage orchestration of Work Packs with DAG dependencies, parallel execution, and artifact flow |
| **Product Runtime** | [RFC-0011](./docs/product-runtime.md) | Long-running product cycle — Schedule → Select → Generate → Deliver → Observe → Adapt — for coaching, learning, and wellness products |
| **Registry Fidelity Gate** | [kdna-registry](https://github.com/aikdna/kdna-registry) | Fidelity evidence as a requirement for validated+ quality badges |
| **SDK** | [@aikdna/kdna-artifact-engine](https://www.npmjs.com/package/@aikdna/kdna-artifact-engine) · [@aikdna/kdna-fidelity-core](https://www.npmjs.com/package/@aikdna/kdna-fidelity-core) | TypeScript reference implementations |
| **CLI** | `kdna protocol validate` / `inspect` | Schema validation for all RFC artifacts |
| **E2E Demo** | [kdna-lab](https://github.com/aikdna/kdna-lab) | Full protocol chain: load → pipeline → envelope → fidelity → result |

> **Phase 2 architecture:** [docs/phase2-architecture.md](./docs/phase2-architecture.md) — integration matrix, data flow, and RFC status tracking.

A `.kdna` asset is not created by writing JSON files. It is compiled by a
Studio-compatible authoring pipeline that performs human confirmation,
validation, canonicalization, identity generation, digest computation, signing,
optional encryption, and provenance recording.

## The KDNA Stack

AIKDNA = the ecosystem / brand  
KDNA Protocol = the open judgment protocol  
KDNA Domain Asset = a portable domain judgment asset

**Protocol first. Products are reference implementations.**

KDNA Protocol is open. KDNA CLI is reference tooling. Compatible clients serve as reference implementations for loading and comparing judgment domains. Authoring environments serve as reference implementations for creating and locking domains. Third-party apps can implement the same runtime contract.

## For whom

| You are | Start here |
|---------|-----------|
| **AI user** who wants better judgment from the same model | [5-minute guide](./docs/5-minute-guide.md) — load domains, compare responses, see judgment differences |
| **Domain expert** who wants to encode expertise as verifiable assets | [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) — interview → cards → lock → test → export |
| **Developer** integrating KDNA into agents or tools | [kdna-cli](https://github.com/aikdna/kdna-cli) · [kdna-core](https://www.npmjs.com/package/@aikdna/kdna-core) — install, validate, load, compare |
| **Tool builder** adding KDNA support to editors/IDEs | [kdna-vscode](https://github.com/aikdna/kdna-vscode) · [kdna-skills](https://github.com/aikdna/kdna-skills) |
| **Team lead** wanting reusable AI work capabilities with judgment | [kdna-workpack](https://github.com/aikdna/kdna-workpack) — package KDNA + Skills + Gates into runnable Work Packs |

## Open Ecosystem Readiness

External integrations should start with:

- [`docs/kdna-v1rc-standard-kit.md`](./docs/kdna-v1rc-standard-kit.md) for the canonical v1.0-rc implementer bundle.
- [`docs/STUDIO_EXPORT_CONTRACT.md`](./docs/STUDIO_EXPORT_CONTRACT.md) for the required asset build outputs.
- [`docs/ASSET_IDENTITY_MODEL.md`](./docs/ASSET_IDENTITY_MODEL.md) for asset/project/build identity fields.
- [`@aikdna/kdna-core`](./packages/kdna-core) for stable asset-first APIs.
- [`conformance/`](./conformance) for loader and validator compatibility tests.
- [`docs/kdna-compatible-certification.md`](./docs/kdna-compatible-certification.md) for KDNA-compatible levels and certification boundaries.
- [`rfcs/`](./rfcs) for protocol evolution.
- [`docs/open-ecosystem-readiness.md`](./docs/open-ecosystem-readiness.md) for the current ecosystem readiness contract.

## Why now

> **Agents already have general judgment. What they still need is explicit, human-led domain judgment systems that can be inspected, governed, and reused.**

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
- A **composable protocol** — multiple domain assets can be loaded together with conflict reporting

### KDNA is not:

- **Not a model or LLM.** KDNA loads alongside the model as a judgment reference. It does not generate text, reason, or predict.
- **Not a prompt library.** Prompts are task-scoped and ephemeral. KDNA is domain-scoped and version-controlled.
- **Not RAG or a knowledge base.** RAG retrieves facts. KDNA encodes what matters and what to watch for.
- **Not a workflow engine or skill.** Skills define steps. KDNA defines the judgment criteria across those steps.
- **Not fine-tuning.** Fine-tuning internalizes behavior into model weights. KDNA keeps judgment explicit, auditable, and editable.
- **Not role-play.** KDNA does not ask an agent to pretend to be an expert. It provides structured judgment constraints, boundaries, and self-checks.
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

For a deeper comparison, see [KDNA and the AI Stack](./docs/kdna-and-ai-stack.md).

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

Want to create your own trusted KDNA? Start with the authoring tool of your choice. An authoring pipeline turns human-reviewed judgment cards into canonical `.kdna` assets with authoring provenance, Human Locks, compiler metadata, and asset digest. `kdna-cli` verifies, installs, loads, compares, publishes, and audits existing `.kdna` assets; it does not author trusted KDNA.

---

## What to read next

| If you are a... | Read this |
|-----------------|-----------|
| **Understanding why KDNA matters when LLMs are already intelligent** | [Judgment Systems](./docs/judgment-systems.md) |
| **Seeing a complete KDNA workflow from file to trace** | [First Domain Walkthrough](./docs/first-domain-walkthrough.md) |
| **Comparing KDNA with RAG, Memory, Skills, MCP, Workflows, Evals** | [KDNA and the AI Stack](./docs/kdna-and-ai-stack.md) |
| **Reading the white paper** | [KDNA White Paper](./docs/kdna-whitepaper.md) |
| **Developer wanting to connect KDNA to an agent** | [5-minute guide](./docs/5-minute-guide.md) |
| **Domain expert wanting to encode your judgment** | [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) — Studio-compatible command-line authoring (`@aikdna/kdna-studio-cli`) |
| **Evaluator wanting to measure judgment improvement** | [Evaluation guide](./docs/evaluation.md) |
| **App developer integrating KDNA into clients, authoring tools, or agent runtimes** | [App Runtime Contract](./docs/app-runtime-contract.md) |
| **Enterprise evaluating private deployment** | [Enterprise guide](./docs/enterprise.md) |
| **Contributor wanting to improve KDNA itself** | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| **Curious about the full specification** | [SPEC.md](./SPEC.md) |
| **Understanding governance and safety** | [Governance](./docs/GOVERNANCE.md) · [Safety](./docs/SAFETY.md) · [Risk Policy](./docs/RISK_POLICY.md) · [KDNA Card Spec](./docs/KDNA_CARD_SPEC.md) · [Security](./docs/SECURITY.md) |
| **Understanding ecosystem naming** | [Ecosystem Naming](./docs/ECOSYSTEM_NAMING.md) |
| **Navigating all repositories** | [Ecosystem Map](./docs/ecosystem-map.md) |
| **Seeing KDNA change agent judgment** | [Demos](./demos/) — writing · agent_safety · prompt_diagnosis |
| **Tracking v1.0-rc progress** | [Release Board](./docs/V1RC_RELEASE_BOARD.md) |
| **Browsing available domains** | [Registry](https://github.com/aikdna/kdna-registry) · [aikdna.com/domains](https://aikdna.com/domains) |
| **Reading the project roadmap** | [ROADMAP.md](./docs/ROADMAP.md) |
| **Reading in Chinese** | [中文版](./README.zh.md) |

---

## Repository Map

| Repository | Role | For |
|------------|------|-----|
| [kdna](https://github.com/aikdna/kdna) | Protocol, SPEC, core library, governance docs | Everyone |
| [kdna-registry](https://github.com/aikdna/kdna-registry) · [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) · [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Runtime tools, registry, authoring CLI | Developers · domain authors |
| [kdna-agent_safety](https://github.com/aikdna/kdna-agent_safety) · [kdna-writing](https://github.com/aikdna/kdna-writing) · [kdna-prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) · [kdna-code_review](https://github.com/aikdna/kdna-code_review) · [kdna-authoring](https://github.com/aikdna/kdna-authoring) | First-launch official domain assets (signed `.kdna`, Human Lock, bilingual en/zh-CN) | Domain consumers |
| Website | Hosted at [aikdna.com](https://aikdna.com) | Web contributors |

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
- [`aikdna/kdna-studio-core`](https://github.com/aikdna/kdna-studio-core) — authoring kernel (`@aikdna/kdna-studio-core`)
- [`aikdna/kdna-studio-cli`](https://github.com/aikdna/kdna-studio-cli) — CLI authoring entry point
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

KDNA does not replace these mechanisms. It provides a judgment reference layer that operates alongside them. For a deeper comparison, see [KDNA and the AI Stack](./docs/kdna-and-ai-stack.md).

---

## FAQ

<details>
<summary>Is this related to biological kDNA, aikdna, or other DNA projects?</summary>

No. In this project, KDNA refers to the KDNA Protocol: an open judgment protocol for AI systems. It focuses on human-governed domain judgment assets, not biological kinetoplast DNA, goal-tracking SaaS, codebase summaries, agent identity profiles, or model lineage analysis.
</details>

<details>
<summary>How is KDNA different from Prompt, RAG, Skills, and MCP?</summary>

- **Prompt** changes what AI says — task-scoped, ephemeral.
- **RAG** changes what AI can access — retrieves facts.
- **Tools/Skills/MCP** change what AI can do — connect to actions.
- **KDNA** changes how AI judges — domain-scoped, version-controlled, auditable.

KDNA is the judgment reference layer. It does not replace these mechanisms — it sits alongside them.
</details>

<details>
<summary>Does a .kdna file contain a person's full judgment?</summary>

No. A .kdna file contains a bounded judgment framework. Just as a .doc contains only a portion of someone's knowledge, a .kdna file contains a portion of the principles, boundaries, standards, and taste that a person or team chooses to encode. Multiple .kdna files can form a judgment asset library — but no single file claims to capture a person's complete judgment ability.
</details>

<details>
<summary>Is KDNA just a fancy system prompt?</summary>

No. System prompts are free-text behavioral instructions scoped to a single conversation. KDNA is a structured, validated, version-controlled format with explicit fields (axioms, boundaries, self-checks, failure risks). KDNA packages are designed to be signed, hash-verified, and distributed through a registry — a system prompt is none of these.
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

Yes — start with [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) (`@aikdna/kdna-studio-cli`) for guided authoring, Human Lock, compile, and export. To install and use domains with your AI agent, you only need the runtime CLI (`npm install -g @aikdna/kdna-cli`). Hand-written dev source directories are non-canonical and cannot become trusted assets unless compiled by a Studio-compatible pipeline.
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

- **Code** (CLI, authoring tools, Registry, Skills, VS Code extension): Apache-2.0
- **Documentation, examples, and domain content**: CC-BY-4.0
See [LICENSE](LICENSE) and [LICENSE-DOCS](LICENSE-DOCS) for full terms.

## Open Standard, Not Open Identity

KDNA is open source because domain judgment should become shared infrastructure for AI agents. We welcome developers, researchers, creators, and organizations to build KDNA domains, tools, validators, loaders, and agent integrations.

**The format is open so the ecosystem can grow. The identity is protected so the ecosystem does not fragment.**

However, KDNA is intended to grow as a **coherent open standard**, not as a set of fragmented renamed protocols. Forks are welcome for experimentation, but public derivative protocols must clearly identify themselves as independent and must not imply official KDNA compatibility or endorsement unless they follow the official SPEC and compatibility policy.

- [TRADEMARK.md](./TRADEMARK.md) — KDNA name and marks protection
- [COMPATIBILITY.md](./COMPATIBILITY.md) — what "KDNA-compatible" means
- [FORK_POLICY.md](./FORK_POLICY.md) — constructive forks vs protocol forks
- [GOVERNANCE.md](./docs/GOVERNANCE.md) — how the standard evolves
- [registry-policy.md](./docs/registry-policy.md) — registry governance
