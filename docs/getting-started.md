# Getting Started with KDNA

> [中文版](./getting-started.zh.md)

KDNA has two roles: **consumer** (use existing domains) and **creator** (author your own). This guide covers both.

---

## Consumer Path: Use KDNA Domains

### 1. Install the CLI

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

This installs the `kdna` command and the `kdna-loader` skill for your AI agent.

### 2. Install a Domain

```bash
kdna install @aikdna/writing
```

Or browse available domains:

```bash
kdna list --available
```

### 3. Use It

Your agent will automatically discover installed KDNA domains via `kdna-loader`. When a user asks about a domain-related task, the agent loads the domain silently and applies its judgment. The user sees better judgment, not KDNA internals.

---

## Creator Path: Author a KDNA Domain

**There is exactly one trusted creation path for KDNA assets:**

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain
```

This creates a Studio project (`studio.project.json`) — the canonical authoring workspace.

### Authoring Workflow

1. **Create** a Studio project: `kdna-studio create my-domain`
2. **Add cards** (judgment cards for axioms, ontology, misunderstandings): `kdna-studio card add`
3. **Lock** cards when they are ready: `kdna-studio lock --all`
4. **Compile** into a `.kdna` asset: `kdna-studio compile`
5. **Export** a trusted `.kdna` file: `kdna-studio export`

### What is NOT a trusted creation path

- `kdna dev scaffold` — Creates non-canonical dev source directories for experimentation only
- `kdna dev pack` — Builds dev-only non-trusted bundles; not eligible for quality badges
- Manual JSON editing — Valid for early prototyping but does not produce trusted assets

### For open-source domain contributors

Domain repos use dev source directories for Git collaboration and CI validation. To validate a dev source directory:

```bash
kdna dev validate .
```

Trusted `.kdna` assets are then compiled and published via `kdna-studio`.

---

## What KDNA Does Not Do

KDNA is a judgment layer, not:
- A prompt library (it doesn't store wording templates)
- A knowledge base (it doesn't store facts or documents)
- A tool API (it doesn't execute actions)
- A retrieval system (it doesn't search external data)
- An operating manual (it doesn't describe procedures)

It sits between your agent and its task, shaping how the agent thinks before it acts.
