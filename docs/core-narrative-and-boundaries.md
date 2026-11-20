# KDNA Core Narrative and Boundaries

This document states clearly what KDNA is, how `.kdna` files fit alongside the rest of the AI ecosystem, and the clean technical boundaries the protocol maintains. For wire-level schemas and container rules, see [`SPEC.md`](../SPEC.md) and [`SPEC-INDEX.md`](../SPEC-INDEX.md).

---

## 1. Core Definition

> **KDNA (`.kdna`) is an open file format and selective reading protocol for expressible human thinking, judgment, trade-offs, boundaries, and taste.**

Just as prose has `.md`/`.pdf`, data has spreadsheets, and logic has code, KDNA gives bounded judgment systems their own independent, portable, versioned file—readable directly by humans in **KDNA Reader** and selectively consumable by any compatible AI Agent (`@aikdna/kdna-cli@0.45.1`, `@aikdna/kdna-core@0.37.11`, `@aikdna/kdna-read@0.13.5`).

An individual or team can keep a concise six-judgment craft file or a full forty-five-judgment domain system as a `.kdna` work. The format is permanently account-free, works offline, and supports optional local password encryption (`kdna protect`, `RFC-0018`).

---

## 2. How KDNA Fits with Tools, Skills, Knowledge, and Models

KDNA works naturally alongside the rest of an AI workflow—each layer doing its own job:

- **AI Models** provide general reasoning and language generation.
- **Documents, Wikis, and RAG** store and search factual reference material and current context.
- **Skills, Workflows, and MCP Tools** automate procedures and interact with external systems.
- **KDNA (`.kdna`)** carries an independent, human-inspectable, versioned judgment work with explicit authorship, premises, trade-offs, and stop boundaries—portable across any model or Agent.

Other tools and documents can of course contain rules or preferences too; KDNA does not claim exclusive ownership of judgment or automatic behavioral superiority. Its role is giving judgment works a clean, open, independent asset and a shared loading contract across tools.

---

## 3. Clean Technical Boundaries

Keeping these four boundaries crisp protects both authors and users:

1. **Format validity vs. real-world judgment quality.** Passing `kdna validate` confirms that a `.kdna` file's container layout, schema, checksums, and optional signatures are intact. Judging whether an author's stance is wise, accurate, or right for your situation always belongs to humans with real context and evidence.
2. **Reading vs. system authority.** Admitting and reading a `.kdna` file delivers structured judgment text only. It never grants permission to write files, access networks, execute commands, or override user intent, verified facts, law, or Host safety policies.
3. **Explicit user choice (no silent activation).** KDNA does not require a global asset library or hidden background loading. A user or Host explicitly selects which `.kdna` file and version applies to a task, with clear visibility to inspect, switch, disable, or roll back at any time.
4. **Visible versions and provenance.** Revisions produce explicit new versions (`1.0.0` → `1.1.0`) inspectable via `kdna diff --format human`. Authorship, source references, and optional human confirmation are recorded transparently as declared metadata.

---

## 4. Current Published Line

The active Container `0.6.0` line uses **Core `0.37.11`**, **Read `0.13.5`**, and **CLI `0.45.1`**:

```text
explicit .kdna file
→ Core admission (container, manifest, digests, optional RFC-0018 unlock)
→ Selective Read (catalog → exact_selection with mandatory closure → optional expand)
→ Host delivery & human-visible Agent use
```

See [Status](./status.md) and [Current Release Support](./current-release-support.md) for published package coordinates and archived legacy lines.
