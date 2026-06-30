# Start Here

**Skills give agents hands. KDNA gives them judgment.**

KDNA is an open file format and protocol for packaging domain judgment and loading it into AI agents — portable, verifiable, and yours.

In 5 minutes, you can load a real judgment asset into your agent context and see the difference.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **See KDNA work with a real asset** | [5-Minute Quick Start](#5-minute-quick-start) | 5 min |
| **Create my own KDNA** | [30-Minute Authoring Guide](./30-minute-authoring-guide.md) | 30 min |
| **Load KDNA into my AI agent** | [15-Minute Agent Guide](./15-minute-agent-guide.md) | 15 min |
| **Understand the protocol** | [KDNA and the AI Stack](./kdna-and-ai-stack.md) | 15 min |
| **Contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) | 5 min |

---

## 5-Minute Quick Start

```bash
npm install -g @aikdna/kdna-cli

# Load a real judgment asset — see what changes
curl -LO https://github.com/aikdna/kdna-assets/releases/download/agent-project-context-v0.1.2/agent-project-context-v0.1.2.kdna
kdna validate agent-project-context-v0.1.2.kdna
kdna plan-load agent-project-context-v0.1.2.kdna
kdna load    agent-project-context-v0.1.2.kdna --profile=compact --as=prompt
```

Expected validation result:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

## Create your own asset

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain --name @yourscope/my-domain
kdna-studio card add my-domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
kdna-studio card approve my-domain --all --by your-id --statement "I confirm this judgment for v1 export."
kdna-studio export my-domain --format v1 --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

---

## What KDNA Is (and Isn't)

| KDNA is | KDNA is NOT |
|---------|------------|
| A judgment reference agents load before acting | A prompt library |
| Structured axioms, boundaries, self-checks | A RAG / knowledge base |
| Version-controlled, verifiable | A workflow engine |
| Cross-agent portable | Model fine-tuning |
| Scoped judgment structures with optional provenance | A `.cursorrules` replacement |

Tools let AI **act**. KDNA helps AI **judge**.

---

## Repository Map

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**. The following are the active official toolchain components:

| Repo | Role |
|------|------|
| [kdna](https://github.com/aikdna/kdna) | Official KDNA Core spec, toolchain entry, schemas, docs |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Official runtime CLI: inspect, validate, pack, unpack, load |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Authoring CLI for creating and exporting v1 `.kdna` assets |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Official agent loader adapter |

---

## Current State

KDNA Core v1 is in public beta for local packaged `.kdna` creation,
validation, LoadPlan diagnostics, and loading. See [Status](./status.md) for
the full beta / preview / future boundary.

---

New to KDNA? This page is your entry. Everything else links back here.
