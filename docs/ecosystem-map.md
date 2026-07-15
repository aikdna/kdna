# KDNA Ecosystem Map

> **Archived historical snapshot.** This page preserves an earlier ecosystem
> map and version matrix. It is not active guidance. Start with
> [Start Here](./start-here.md), [Status](./status.md), and
> [Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
>
> **历史归档快照。** 本页保留早期生态地图与版本矩阵，不是当前使用指南。请改读[从这里开始](./start-here.md)、[当前状态](./status.md)和[核心叙事与边界](./core-narrative-and-boundaries.md)。

If you've found one KDNA repository and are wondering which others exist and what they do — this is the map.

## Four-Layer Protocol Stack

```
┌──────────────────────────────────────────────────────────────┐
│ LAYER 4 — Applications                                       │
│ Reference clients · authoring tools · runtime workbenches     │
├──────────────────────────────────────────────────────────────┤
│ LAYER 3 — Runtime & Protocol                                 │
│ kdna-cli · kdna-core · kdna-core-swift · kdna-skills · MCP   │
├──────────────────────────────────────────────────────────────┤
│ LAYER 2 — Domain Content                                     │
│ agent_safety · writing · code_review · prompt_diagnosis      │
│ kdna_authoring · requirement_alignment · sketchnote-style    │
├──────────────────────────────────────────────────────────────┤
│ LAYER 1 — Protocol Definition                                │
│ kdna (SPEC · schemas · conformance · governance)             │
└──────────────────────────────────────────────────────────────┘
```

## Layer 1 — Protocol & Specification

| Repository | NPM/Name | Role | Entry Point |
|------------|----------|------|-------------|
| [aikdna/kdna](https://github.com/aikdna/kdna) | monorepo | Protocol SPEC, schemas, docs, governance, benchmarks | [README](https://github.com/aikdna/kdna) |
| └ `packages/kdna-core` | `@aikdna/kdna-core` | JS runtime core: load, validate, inspect, render, compose | [package](https://github.com/aikdna/kdna/tree/main/packages/kdna-core) |
| └ `packages/kdna-eval` | `@aikdna/kdna-eval` | Scoring primitives: condition matching, dimension scoring | [package](https://github.com/aikdna/kdna/tree/main/packages/kdna-eval) |
| └ `conformance/` | — | Loader/validator/runtime compatibility tests | [conformance](https://github.com/aikdna/kdna/tree/main/conformance) |

## Layer 2 — Public `.kdna` Examples

> **Historical note:** Layer 2 previously listed individual GitHub repositories
> and pre-v1 example names as public entry points. KDNA public examples must now
> be distributed as packaged `.kdna` files with release cards. The historical
> examples listed below are not current downloads.

| Example file | Domain | Status |
|------------|--------|--------|
| `writing-v1.kdna` | Writing diagnosis | Historical name; not currently released |
| `prompt-diagnosis-v1.kdna` | Prompt quality | Historical name; not currently released |
| `agent-safety-v1.kdna` | Agent safety gates | Historical name; not currently released |

Historical proof projects are not public entry points. Public users should
start with the packaged reference assets or the local demo path in
[try-kdna](./try-kdna.md).

## Layer 3 — Runtime & Protocol Tools

### Runtime Control Plane

| Repository | Package/Command | Role | For |
|------------|----------------|------|-----|
| [kdna-cli](https://github.com/aikdna/kdna-cli) | `@aikdna/kdna-cli` / `kdna` | Install, verify, load, compare, publish existing `.kdna` assets | Developers, agent users |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | SwiftPM `kdna-core-swift` | Native Swift runtime: load, validate, route, compose | macOS/iOS developers |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | `@aikdna/kdna-mcp-server` | Agent loader adapters + MCP server | Agent integrators |
| [kdna-vscode](https://github.com/aikdna/kdna-vscode) | VS Code extension | Validate, preview, diagnose dev source workspaces | VS Code users |

### Authoring Tools

| Repository | Package/Command | Role | For |
|------------|----------------|------|-----|
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | `@aikdna/kdna-studio-core` | Authoring kernel: project model, cards, Human Lock, compiler | App developers |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | `@aikdna/kdna-studio-cli` / `kdna-studio` | CLI authoring entry: create, lock, compile, export | Domain creators |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | SwiftPM `kdna-studio-swift` | Native Swift authoring: create KDNA on Apple platforms | Swift developers |

### Distribution & Trust

| Repository | Role | For |
|------------|------|-----|
| (out of scope) kdna-registry | Canonical static catalog (`domains.json`), trust model, schema v3 — registry is out of scope for KDNA Core | Registry operators (external) |

## Layer 4 — Applications

KDNA-compatible applications are built by the ecosystem. Reference implementations
include consumption clients, authoring tools, runtime workbenches, and mobile
runtimes. Third-party apps can implement the same runtime contract — see
[docs/app-runtime-contract.md](./app-runtime-contract.md).

## Entry Points by Role

### I want to install KDNA domains for my AI agent
```
npm install -g @aikdna/kdna-cli  →  download .kdna file  →  kdna validate <asset>.kdna  →  kdna load <asset>.kdna
```
See: [5-minute guide](./5-minute-guide.md) · [integrations](./integrations.md)

### I want to create my own KDNA domain
```
kdna-studio create my_domain  →  kdna-studio export my_domain --sign
```
See: [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) · [authoring guide](./authoring-guide.md)

### I want to integrate KDNA into my app/agent
```javascript
const { loadDomain, formatContext } = require('@aikdna/kdna-core');
```
See: [kdna-core](https://github.com/aikdna/kdna/tree/main/packages/kdna-core) · [app runtime contract](./app-runtime-contract.md)

### I want to build a KDNA-compatible loader/runtime
```
node conformance/run.mjs --profile loader
```
See: [Core Narrative and Boundaries](./core-narrative-and-boundaries.md) · [conformance](../conformance/)

### I want to test KDNA with my team or organization
See: [team and organization pilot](./enterprise-pilot.md)

### I want to understand the protocol specification
See: [SPEC.md](../SPEC.md) · [Core Narrative and Boundaries](./core-narrative-and-boundaries.md)

### I want to contribute to KDNA itself
See: [CONTRIBUTING.md](../CONTRIBUTING.md) · [GOVERNANCE.md](./GOVERNANCE.md) · [ROADMAP.md](./ROADMAP.md)

## Naming Conventions

- All npm packages: `@aikdna/kdna-*`
- CLI commands: `kdna` (runtime), `kdna-studio` (authoring)
- Swift modules: `KDNACore`
- GitHub repos: `aikdna/kdna-*` (hyphens for tools, underscores for domain repos being migrated)

See [ECOSYSTEM_NAMING.md](./ECOSYSTEM_NAMING.md) for the full naming policy.

## Version Matrix

| Component | Current | Notes |
|-----------|---------|-------|
| SPEC | 1.0-rc | [kdna-v1rc-standard-kit.md](./kdna-v1rc-standard-kit.md) |
| `@aikdna/kdna-core` | 0.7.2 | JS runtime core |
| `@aikdna/kdna-cli` | 0.19.x | Reference CLI |
| `@aikdna/kdna-studio-core` | 1.4.2 | Authoring kernel |
| `@aikdna/kdna-studio-cli` | 0.2.0 | Authoring CLI |
| `kdna-core-swift` | main | Swift runtime |
| Registry schema (out of scope) | 3.0 | Historical: [SCHEMA.md](https://github.com/aikdna/kdna-registry/blob/main/SCHEMA.md) (note: this repo is not part of the public KDNA Core) |
