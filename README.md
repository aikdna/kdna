# KDNA

> [![npm](https://img.shields.io/npm/v/@aikdna/kdna)](https://www.npmjs.com/package/@aikdna/kdna) [![CI](https://github.com/aikdna/KDNA/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/KDNA/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**KDNA is an open protocol for packaging domain judgment into loadable, testable, governable assets for AI agents.**

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
| **Domain expert wanting to encode your judgment** | [Judgment Anatomy](./docs/judgment-anatomy.md) — how to decompose your expertise into 13 structured elements |
| **Evaluator wanting to measure judgment improvement** | [Evaluation guide](./docs/evaluation.md) |
| **Enterprise evaluating private deployment** | [Enterprise guide](./docs/enterprise.md) |
| **Contributor wanting to improve KDNA itself** | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| **Curious about the full specification** | [SPEC.md](./SPEC.md) |
| **Browsing available domains** | [Registry](https://github.com/aikdna/kdna-registry) · [aikdna.com/domains](https://aikdna.com/domains) |
| **Reading in Chinese** | [中文版](./README.zh.md) |

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
