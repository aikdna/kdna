# Start Here

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**. `.kdna` assets are created, inspected, loaded, and consumed through the **official KDNA toolchain** (the official SDK, CLI, Loader, and API). Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

In 5 minutes, you can see an AI agent diagnose problems differently with KDNA loaded.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **See KDNA work** | [5-Minute Quick Start](#5-minute-quick-start) | 5 min |
| **Create my own KDNA** | [30-Minute Authoring Guide](./30-minute-authoring-guide.md) | 30 min |
| **Load KDNA into my AI agent** | [15-Minute Agent Guide](./15-minute-agent-guide.md) | 15 min |
| **Understand the protocol** | [Phase 2 Walkthrough](./phase2-walkthrough.md) | 60 min |
| **Contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) | 5 min |

---

## 5-Minute Quick Start

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

You'll see the loaded compact prompt include judgment boundaries.

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
kdna-studio card add my-domain axiom --field one_sentence="Your judgment here"
kdna-studio export my-domain --format v1 --out dist/my-domain.kdna
kdna validate dist/my-domain.kdna
kdna plan-load dist/my-domain.kdna
kdna load dist/my-domain.kdna --profile=compact --as=prompt
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

KDNA Core v1 is the **official KDNA judgment-asset format**. The format and the official toolchain are versioned together.

**Not stable / not claimed:** Registry, marketplace, paid domains, quality badges, enterprise governance, OCI distribution.

---

New to KDNA? This page is your entry. Everything else links back here.
