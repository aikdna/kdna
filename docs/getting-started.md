# Getting Started with KDNA

> [中文版](./getting-started.zh.md)

KDNA has two roles: **consumer** (use existing domains) and **creator** (author your own). This guide covers both.

---

## Consumer Path: Use Local v1 KDNA Assets

### 1. Install the CLI

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

This installs the `kdna` command and the `kdna-loader` skill for your AI agent.

### 2. Validate a Local Asset

```bash
kdna validate ./dist/writing-v1.kdna
```

Then load it into an agent prompt:

```bash
kdna load ./dist/writing-v1.kdna --profile=compact --as=prompt
```

### 3. Use It

Your agent will automatically discover installed KDNA domains via `kdna-loader`. When a user asks about a domain-related task, the agent loads the domain silently and applies its judgment. The user sees better judgment, not KDNA internals.

---

## Creator Path: Author a KDNA Domain

**The current official creation path for v1 `.kdna` assets is Studio CLI:**

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain
```

This creates a Studio project (`studio.project.json`) — the canonical authoring workspace.

### Authoring Workflow

1. **Create** a Studio project: `kdna-studio create my-domain`
2. **Add cards** (judgment cards for axioms, ontology, misunderstandings): `kdna-studio card add`
3. **Lock** cards when they are ready: `kdna-studio lock --all`
4. **Export** a v1 `.kdna` asset: `kdna-studio migrate <source> --format v1 --out dist/my-domain.kdna`
5. **Validate/load** with the runtime CLI: `kdna validate dist/my-domain.kdna` and `kdna load dist/my-domain.kdna --profile=compact --as=prompt`

### What is NOT the current official v1 creation path

- `kdna dev scaffold` — Creates non-canonical dev source directories for experimentation only
- `kdna dev pack` — Builds dev-only bundles; not the official Studio v1 export path
- Manual JSON editing — Valid for early prototyping but does not produce official v1 Studio exports

### For open-source domain contributors

Domain repos use dev source directories for Git collaboration and CI validation. To validate a dev source directory:

```bash
kdna dev validate .
```

Launch-grade `.kdna` assets are exported with `kdna-studio migrate --format v1`
and validated with `kdna validate`.

---

## What KDNA Does Not Do

KDNA is a judgment layer, not:
- A prompt library (it doesn't store wording templates)
- A knowledge base (it doesn't store facts or documents)
- A tool API (it doesn't execute actions)
- A retrieval system (it doesn't search external data)
- An operating manual (it doesn't describe procedures)

It sits between your agent and its task, shaping how the agent thinks before it acts.
