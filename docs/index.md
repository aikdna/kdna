# KDNA Documentation

KDNA is a portable, inspectable, and verifiable format for domain judgment — the principles an expert reasons from, the traps they avoid, and the self-checks they run before deciding.

Load a `.kdna` asset into any supported AI agent to give it structured judgment context.

## Quickstart

```bash
npm install -g @aikdna/kdna-cli
curl -LO https://github.com/aikdna/kdna-assets/releases/download/agent-project-context-v0.1.2/agent-project-context-v0.1.2.kdna
kdna load agent-project-context-v0.1.2.kdna --profile=compact --as=prompt
```

## Sections

- [Getting Started](/start) — 5-minute onboarding
- [Concepts](/concepts) — judgment assets, domains, profiles
- [Protocol](/protocol) — `.kdna` container spec, authorization, validation
- [CLI](/cli) — `kdna` command reference
- [Web](/web) — browser client, server, React integration
- [Assets](/assets) — official asset catalog
- [Agent Integration](/agents) — loader setup for Claude Code, Codex, OpenCode, Cursor
- [Reference](/reference) — API surface, npm packages, changelogs

## Packages

| Package | npm | Purpose |
|---|---|---|
| `@aikdna/kdna-cli` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) | CLI runtime |
| `@aikdna/kdna-core` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-core)](https://www.npmjs.com/package/@aikdna/kdna-core) | Core validation + crypto |
| `@aikdna/kdna-studio-cli` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-studio-cli)](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) | Authoring CLI |
| `@aikdna/kdna-studio-core` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-studio-core)](https://www.npmjs.com/package/@aikdna/kdna-studio-core) | Authoring kernel |
| `@aikdna/kdna-web-client` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-web-client)](https://www.npmjs.com/package/@aikdna/kdna-web-client) | Browser client |
| `@aikdna/kdna-web-server` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-web-server)](https://www.npmjs.com/package/@aikdna/kdna-web-server) | Server adapters |
| `@aikdna/kdna-react` | [![npm](https://img.shields.io/npm/v/@aikdna/kdna-react)](https://www.npmjs.com/package/@aikdna/kdna-react) | React components |
| `create-kdna-web-app` | [![npm](https://img.shields.io/npm/v/create-kdna-web-app)](https://www.npmjs.com/package/create-kdna-web-app) | Project scaffolder |
