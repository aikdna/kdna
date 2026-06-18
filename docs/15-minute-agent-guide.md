# Load KDNA into your AI agent in 15 minutes

## What this guide proves

After running through the [5-minute path](./try-kdna.md), you have a working
`.kdna` file. This guide shows how to prepare your AI agent to use KDNA.

## Prerequisites

- Node.js >= 18
- npm
- Completed the [5-minute path](./try-kdna.md) (you have a `.kdna` file)
- One of: OpenCode, Codex, Claude Code, Cursor, or Gemini

## Step 1: Install the official KDNA CLI

```bash
npm install -g @aikdna/kdna-cli
```

## Step 2: Create a demo asset

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
```

This creates a local `.kdna` file from the minimal demo fixture. No registry.
No network.

## Step 3: Setup the agent loader

```bash
kdna setup
```

`kdna setup` detects your AI agent (OpenCode, Codex, Claude Code, Cursor,
or Gemini), installs the `kdna-loader` skill adapter, and creates the data
directory.

## Step 4: Verify agent detection

```bash
kdna doctor --agents
```

This shows which agents were detected, which have the loader installed, and
whether the configuration is consistent.

## Step 5: Load KDNA context

```bash
kdna load ./minimal.kdna --as=prompt
```

This emits the judgment asset in a form that the agent can read.
See the [current limitations](#current-limitations) for the status of
v1 load-contract support.

## What works today

| Feature | Status | Notes |
|---|---|---|
| `kdna demo minimal` | stable | Creates a v1 fixture, no registry needed |
| `kdna inspect` | stable | Reads v1 source dirs and .kdna containers |
| `kdna validate` | stable | Schema + format + payload + checksums + load-contract |
| `kdna pack` | stable | Deterministic ZIP (same input → same SHA-256) |
| `kdna unpack` | stable | Extract .kdna container |
| `kdna setup` | beta | Agent detection and loader install |
| `kdna doctor --agents` | beta | System health check |
| `kdna load --as=prompt` | beta | Emits agent-readable judgment context |
| `kdna compare` | beta | Requires provider API key |

## Current limitations

- **Agent runtime loading is available for v1.** `kdna load` supports v1 `.kdna`
  containers produced by `kdna pack` as of @aikdna/kdna-cli@0.25.1.
- **`kdna compare`** requires a provider API key (ANTHROPIC_API_KEY,
  OPENAI_API_KEY, or equivalent). It is not required for the basic path.
- **Agent support varies by platform.** The `kdna-loader` skill adapter is
  installed automatically by `kdna setup`, but the loader's ability to read
  v1 `.kdna` files depends on the agent's runtime environment and the version
  of `@aikdna/kdna-core` available to the agent.

## Troubleshooting

If `kdna load ./minimal.kdna --as=prompt` returns an error, the expected
behavior is a human-readable message explaining which surface is currently
supported. If you see a stack trace or an unhelpful error, please
[open an issue](https://github.com/aikdna/kdna/issues).
