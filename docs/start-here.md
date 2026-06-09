# Start Here

KDNA is an open protocol that gives AI agents **human-defined judgment standards** — not more prompts, not more tools, not more training data.

In 5 minutes, you can see an AI agent diagnose problems differently with KDNA loaded.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **See KDNA change agent judgment** | [5-Minute Quick Start](#5-minute-quick-start) | 5 min |
| **Load KDNA into my AI agent** | [Load into Codex](https://github.com/aikdna/kdna-skills/blob/main/integrations/codex/README.md) · [Claude Code](https://github.com/aikdna/kdna-skills/blob/main/integrations/claude-code/README.md) · [OpenCode](https://github.com/aikdna/kdna-skills/blob/main/integrations/opencode/README.md) | 3 min |
| **Create my own KDNA** | [First Domain Walkthrough](./first-domain-walkthrough.md) | 30 min |
| **Understand the protocol** | [Phase 2 Walkthrough](./phase2-walkthrough.md) | 60 min |
| **Run benchmarks / verify evidence** | [Benchmark Runbook](./reference-domain-benchmark-runbook.md) | 15 min |
| **Contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) | 5 min |

---

## 5-Minute Quick Start

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing --yes
kdna compare @aikdna/writing --input "Review this article: 'Our product is the best. Customers love it. Get yours today.'"
```

You'll see the same model respond differently — with KDNA, it diagnoses **structural problems** (no argument, no evidence, no cognitive hook) instead of suggesting surface-level fixes.

```bash
# Verify everything is working
kdna doctor --agents
# → OpenCode: detected, kdna-loader installed
# → Codex: detected, kdna-loader installed
# → Claude Code: detected, kdna-loader installed
```

## Two Flagship Domains

| Domain | What it changes |
|--------|----------------|
| **[@aikdna/agent_safety](https://github.com/aikdna/kdna-agent_safety)** | AI agent judges whether an action is safe before executing — checks irreversibility, authorization, backup, and recommends before destructive actions |
| **[@aikdna/code_review](https://github.com/aikdna/kdna-code_review)** | AI code review judges by failure mode, not style — every review comment must name the specific failure mode and verify the fix addresses the root condition |

Both have 30+ eval cases, benchmark reports, and known limitations.

## What KDNA Is (and Isn't)

| KDNA is | KDNA is NOT |
|---------|------------|
| A judgment reference agents load before acting | A prompt library |
| Structured axioms, boundaries, self-checks | A RAG / knowledge base |
| Version-controlled, signed, verifiable | A workflow engine |
| Cross-agent portable | Model fine-tuning |
| Human-locked (axioms require human approval to change) | A `.cursorrules` replacement |

Tools let AI **act**. KDNA helps AI **judge**.

## Repository Map

| Repo | Role | Tier |
|------|------|------|
| [kdna](https://github.com/aikdna/kdna) | Protocol, SPEC, conformance, docs | 0 — Core |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Runtime CLI: install, verify, load, compare | 0 — Core |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Agent loader adapters | 0 — Core |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Authoring CLI: create, lock, compile, export | 0 — Core |
| [kdna-registry](https://github.com/aikdna/kdna-registry) | Trust catalog, quality badges, signatures | 0 — Core |
| [kdna-lab](https://github.com/aikdna/kdna-lab) | Benchmark runner, eval cases, evidence | 1 — Evidence |
| [kdna-workpack](https://github.com/aikdna/kdna-workpack) | KDNA + Skills + Gates → runnable Work Packs | 1 — Evidence |
| [kdna-agent_safety](https://github.com/aikdna/kdna-agent_safety) | Flagship domain: safety judgment | 2 — Reference |
| [kdna-code_review](https://github.com/aikdna/kdna-code_review) | Flagship domain: code review judgment | 2 — Reference |
| [kdna-writing](https://github.com/aikdna/kdna-writing) | Demo domain: writing diagnosis | 2 — Reference |
| [kdna-prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) | Demo domain: prompt root-cause analysis | 2 — Reference |

---

## Current State

KDNA is at **v1.0-rc** (Release Candidate). What's stable and what's not is documented in [State of KDNA](../STATE_OF_KDNA.md).

**Stable for v1.0-rc:** `.kdna` format, CLI JSON contract, conformance suite, agent integration, Phase 2 protocol artifacts.

**Not stable / not claimed:** Marketplace, paid domains, enterprise governance, OCI distribution, more official domains.

**Release evidence:** [v0.9.0 Release Checklist](../RELEASE_CHECKLIST_0.9.0.md) — 63/63 verified.

---

New to KDNA? This page is your entry. Everything else links back here.
