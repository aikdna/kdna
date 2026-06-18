# Start Here

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**. `.kdna` assets are created, inspected, loaded, and consumed through the **official KDNA toolchain** (the official SDK, CLI, Loader, and API). Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

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
kdna validate ./dist/writing-v1.kdna
kdna load ./dist/writing-v1.kdna --profile=compact --as=prompt
```

You'll see the loaded compact prompt include writing judgment boundaries:
structural diagnosis, evidence density, hook priority, self-checks, and
failure modes.

```bash
# Verify everything is working
kdna doctor --agents
# → OpenCode: detected, kdna-loader installed
# → Codex: detected, kdna-loader installed
# → Claude Code: detected, kdna-loader installed
```

## Public Flagship Domains

| Domain | What it changes |
|--------|----------------|
| **[@aikdna/writing](https://github.com/aikdna/kdna-writing)** | Writing diagnosis judges argument, reader, contrast, and evidence before polishing language |
| **[@aikdna/agent_safety](https://github.com/aikdna/kdna-agent_safety)** | AI agent judges whether an action is safe before executing — checks irreversibility, authorization, backup, and destructive-action boundaries |
| **[@aikdna/prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis)** | Prompt diagnosis judges ambiguity, missing constraints, and failure modes before execution |

These are the current public v1 flagship assets.

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

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**. The following are the active official toolchain components:

| Repo | Role |
|------|------|
| [kdna](https://github.com/aikdna/kdna) | Official KDNA Core spec, toolchain entry, schemas, docs |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Official runtime CLI: inspect, validate, pack, unpack, load |
| [kdna-core](https://github.com/aikdna/kdna) | Official loader SDK (packages/kdna-core/) |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Official agent loader adapter |

Integration and future ecosystem repos:

| Repo | Role |
|------|------|
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Authoring CLI for exporting v1 `.kdna` assets |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Swift runtime foundation for Apple-platform KDNA integration |
| [kdna-app-shared](https://github.com/aikdna/kdna-app-shared) | Shared app integration layer for KDNA-aware Apple and desktop experiences |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Native Swift authoring foundation for Apple platforms |
| [kdna-vscode](https://github.com/aikdna/kdna-vscode) | Editor integration for KDNA source workspaces |
| [kdna-workpack](https://github.com/aikdna/kdna-workpack) | Future workflow packaging layer above Core v1 assets |

Domain repos (current public v1 flagship assets): [kdna-writing](https://github.com/aikdna/kdna-writing), [kdna-agent_safety](https://github.com/aikdna/kdna-agent_safety), and [kdna-prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis).

---

## Current State

KDNA Core v1 (`kdna_version: "1.0"`) is the **official KDNA judgment-asset format**. The format and the official toolchain are versioned together.

Current KDNA Core positioning is documented in [`README.md`](../README.md), [`README.zh.md`](../README.zh.md), [`docs/core/definition.md`](./core/definition.md), and [`docs/core/principles.md`](./core/principles.md).

**Not stable / not claimed:** Marketplace, paid domains, enterprise governance, OCI distribution, more official domains.

**Release evidence:** [Release Board](./V1RC_RELEASE_BOARD.md)

---

New to KDNA? This page is your entry. Everything else links back here.
