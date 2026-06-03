# KDNA Ecosystem Map

If you've found one KDNA repository and are wondering which others exist and what they do — this is the map.

## Four-Layer Protocol Stack

```
┌──────────────────────────────────────────────────────────────┐
│ LAYER 4 — Consumption (Apps)                                 │
│ KDNAChat · KDNA Studio · KDNAWork · kdna-ios                  │
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
| └ `conformance/` | — | Loader/validator/runtime compatibility tests | [conformance](https://github.com/aikdna/kdna/tree/main/conformance) |

## Layer 2 — Domain Content (Reference Assets)

These are `.kdna` judgment domain assets. Each is a separate repository containing a signed, versioned domain package.

| Repository | Package | Domain | Quality | Status |
|------------|---------|--------|---------|--------|
| [kdna-writing](https://github.com/aikdna/kdna-writing) | `@aikdna/writing` | Writing diagnosis | tested | Active |
| [kdna-prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) | `@aikdna/prompt_diagnosis` | Prompt quality | tested | Active |
| [kdna-agent_safety](https://github.com/aikdna/kdna-agent_safety) | `@aikdna/agent_safety` | Agent safety gates | tested | Active |
| [kdna-code_review](https://github.com/aikdna/kdna-code_review) | `@aikdna/code_review` | Behavior-first code review | tested | Active |
| [kdna-authoring](https://github.com/aikdna/kdna-authoring) | `@aikdna/kdna_authoring` | KDNA authoring guidance | tested | Active |
| [kdna-requirement_alignment](https://github.com/aikdna/kdna-requirement_alignment) | `@aikdna/requirement_alignment` | Requirement alignment | untested | Experimental |
| [sketchnote-style](https://github.com/aikdna/sketchnote-style) | — | Visual sketchnote style | untested | Experimental |

> **Note:** GitHub repository names with underscores (`kdna-agent_safety`) are being migrated to hyphens (`kdna-agent-safety`). See [ECOSYSTEM_NAMING.md](./ECOSYSTEM_NAMING.md).

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
| [kdna-registry](https://github.com/aikdna/kdna-registry) | Canonical static catalog (`domains.json`), trust model, schema v3 | Registry operators |

## Layer 4 — Applications

| Application | Repository | Platform | Role | Status |
|-------------|-----------|----------|------|--------|
| **KDNAChat** | [aikdna/kdnachat](https://github.com/aikdna/kdnachat) | macOS (SwiftUI) | Consumption client — load, use, compare domains | Beta |
| **KDNA Studio** | [aikdna/kdnastudio](https://github.com/aikdna/kdnastudio) | macOS (SwiftUI) | Authoring tool — interview, cards, Human Lock, export | Beta |
| **KDNAWork** | [aikdna/kdnawork](https://github.com/aikdna/kdnawork) | Tauri v2 (cross-platform) | Agent judgment governance workbench | Phase 1 |
| **kdna-ios** | [aikdna/kdna-ios](https://github.com/aikdna/kdna-ios) | iOS (SwiftUI) | Mobile KDNA runtime | Early |

## Entry Points by Role

### I want to install KDNA domains for my AI agent
```
npm install -g @aikdna/kdna-cli  →  kdna setup  →  kdna install @aikdna/writing
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
See: [v1rc standard kit](./kdna-v1rc-standard-kit.md) · [conformance](./kdna-compatible-certification.md)

### I want to deploy KDNA in my enterprise
See: [enterprise guide](./enterprise.md)

### I want to understand the protocol specification
See: [SPEC.md](../SPEC.md) · [v1rc standard kit](./kdna-v1rc-standard-kit.md)

### I want to contribute to KDNA itself
See: [CONTRIBUTING.md](../CONTRIBUTING.md) · [GOVERNANCE.md](./GOVERNANCE.md) · [ROADMAP.md](./ROADMAP.md)

## Naming Conventions

- All npm packages: `@aikdna/kdna-*`
- CLI commands: `kdna` (runtime), `kdna-studio` (authoring)
- Swift modules: `KDNACore`, `KDNA Studio`
- GitHub repos: `aikdna/kdna-*` (hyphens for tools, underscores for domain repos being migrated)

See [ECOSYSTEM_NAMING.md](./ECOSYSTEM_NAMING.md) for the full naming policy.

## Version Matrix

| Component | Current | Notes |
|-----------|---------|-------|
| SPEC | v1.0-rc | [kdna-v1rc-standard-kit.md](./kdna-v1rc-standard-kit.md) |
| `@aikdna/kdna-core` | 0.7.2 | JS runtime core |
| `@aikdna/kdna-cli` | 0.19.x | Reference CLI |
| `@aikdna/kdna-studio-core` | 1.4.2 | Authoring kernel |
| `@aikdna/kdna-studio-cli` | 0.2.0 | Authoring CLI |
| `kdna-core-swift` | main | Swift runtime |
| Registry schema | 3.0 | [SCHEMA.md](https://github.com/aikdna/kdna-registry/blob/main/SCHEMA.md) |
