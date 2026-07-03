# Getting Started

## 1. Install

```bash
npm install -g @aikdna/kdna-cli
```

Verify:

```bash
kdna version
```

## 2. Load your first asset

Download an official judgment asset and load it:

```bash
curl -LO https://github.com/aikdna/kdna-assets/releases/download/agent-project-context-v0.1.2/agent-project-context-v0.1.2.kdna
kdna load agent-project-context-v0.1.2.kdna --profile=compact --as=prompt
```

The output is a prompt-ready text block you can paste into any AI agent.

## 3. Understand what happened

```bash
kdna validate agent-project-context-v0.1.2.kdna --json
kdna plan-load agent-project-context-v0.1.2.kdna --json
```

- `validate` checks format, schema, payload, checksums, and load contract
- `plan-load` shows the LoadPlan — what the asset declares and what the runtime will do

## 4. Install for agent auto-discovery

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
kdna install agent-project-context-v0.1.2.kdna
```

Now supported agents (Codex, OpenCode, Claude Code, Cursor) will auto-discover installed assets.

## 5. Build a web app

```bash
npx create-kdna-web-app my-kdna-app
cd my-kdna-app
npm install
npm run dev
```

Upload a `.kdna` file in the browser, inspect it, and load its judgment context.

## Next Steps

- [Concepts](/concepts) — understand judgment domains, assets, and profiles
- [CLI Reference](/cli) — full command documentation
- [Web Integration](/web) — browser and server SDK guides
- [Create your own asset](/cli#producer-path) — using Studio CLI
