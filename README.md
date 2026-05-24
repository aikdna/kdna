# KDNA

> [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**AIKDNA stands for AI-native Knowledge DNA — the open ecosystem behind the KDNA Protocol.**

KDNA is an open protocol for packaging domain judgment into loadable, testable, governable assets for AI agents.

Prompts tell AI what to say. Skills tell AI what to do. MCP connects AI to tools.  
**KDNA tells AI how to judge within a domain.**

AI agents have tools, workflows, and knowledge bases. What they lack is transferable judgment — the ability to evaluate a situation the way an expert would, not the way a general-purpose model would. KDNA encodes that judgment in a machine-verifiable, human-inspectable format.

Self-improving agents need judgment governance. Without explicit judgment, improvement becomes drift. KDNA is the protocol for human-governed self-improvement: agents can learn from work, but judgment updates require Human Judgment Lock.

> **Version map**: SPEC `v1.0-rc` · Registry `v2.0`. See [docs/version-matrix.md](./docs/version-matrix.md).

---

## 30-second example

Same model. Same input. Different judgment path.

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
| **Reading in Chinese** | [中文版](./README.zh.md) |

---

## Repository Map

| Repository | Role | For |
|------------|------|-----|
| [KDNA](https://github.com/aikdna/KDNA) | Protocol, SPEC, core library, governance docs | Everyone |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | CLI — install, validate, verify, pack, load, trace | Developers |
| [kdna-studio](https://github.com/aikdna/kdna-studio) | Open-source authoring kernel (`@aikdna/studio-core`) | Domain creators, tool builders |
| [kdna-registry](https://github.com/aikdna/kdna-registry) | Domain catalog — discover, verify, distribute | Publishers, consumers |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Agent loader skill — one loader, many domains | Agent users |
| [kdna-vscode](https://github.com/aikdna/kdna-vscode) | VS Code extension — validate, preview, pack | Editor users |
| [kdna-writing](https://github.com/aikdna/kdna-writing) · [decision_state](https://github.com/aikdna/kdna-decision_state) · [prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) · [agent_safety](https://github.com/aikdna/kdna-agent_safety) · [kdna_authoring](https://github.com/aikdna/kdna-authoring) · [content_strategy](https://github.com/aikdna/kdna-content_strategy) · [knowledge_management](https://github.com/aikdna/kdna-knowledge_management) · [open_source_project](https://github.com/aikdna/kdna-open_source_project) · [code_review](https://github.com/aikdna/kdna-code_review) · [animation](https://github.com/aikdna/kdna-animation) | Official domain packages (all L2 bilingual, 10+ evals) | Domain consumers |
| [aikdna.com](https://github.com/aikdna/kdna-website) | Website source | Web contributors |

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

KDNA does not replace these mechanisms. It provides a cognition layer that operates alongside them. For a deeper comparison, see [Where KDNA fits](https://aikdna.com/docs/positioning).

---

## Languages

[English](./README.md) · [中文](./README.zh.md)

## License

Code: Apache-2.0 · Documentation and examples: CC BY 4.0
