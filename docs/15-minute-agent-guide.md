# Load KDNA into your AI agent in 15 minutes

## What this guide proves

After running through the [5-minute path](./try-kdna.md), you have a working
`.kdna` file. This guide shows how to load it into your AI agent's context.

## Prerequisites

- Node.js >= 18
- npm
- Completed the [5-minute path](./try-kdna.md) (you have a `.kdna` file)

## Step 1: Install the official KDNA CLI

```bash
npm install -g @aikdna/kdna-cli
```

## Step 2: Validate a .kdna asset

```bash
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
```

Expected result:

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

## Step 3: Load judgment context

```bash
kdna load ./minimal.kdna --profile=compact --as=prompt
```

This emits the judgment asset in a form that the agent can read. The agent
references the judgment structure silently — users see better answers, not
KDNA internals.

## Step 4: Use with your agent

Copy the output from `kdna load --as=prompt` into your agent's context or
system instructions. For supported agents (OpenCode, Codex, Claude Code,
Cursor), the `kdna-loader` skill in [kdna-skills](https://github.com/aikdna/kdna-skills)
provides automatic discovery of local `.kdna` assets.

Manual loader setup per agent:

- **OpenCode**: Copy `kdna-skills/kdna-loader/SKILL.md` into `~/.agents/skills/kdna-loader/SKILL.md`
- **Codex**: Copy into `~/.codex/skills/kdna-loader/SKILL.md`
- **Claude Code**: Copy into `~/.claude/skills/kdna-loader/SKILL.md`
- **Cursor**: Copy into `~/.cursor/skills/kdna-loader/SKILL.md`

Once the loader is installed, your agent will discover local `.kdna` assets
and can load judgment on demand.

## What works today

| Feature | Status | Notes |
|---|---|---|
| `kdna demo minimal` | stable | Creates a local fixture for the current format |
| `kdna inspect` | stable | Reads current source dirs and `.kdna` containers |
| `kdna validate` | stable | Schema + format + payload + checksums + load-contract |
| `kdna pack` | stable | Reproducible ZIP with a pinned packer toolchain; DEFLATE bytes may differ across compressors |
| `kdna unpack` | stable | Extract .kdna container |
| `kdna load --as=prompt` | available | Emits agent-readable judgment context |
| `kdna load --profile=compact` | available | Compact judgment profile for token efficiency |

## Current limitations

- **Agent runtime loading is available for the current format.** `kdna load`
  supports `.kdna` containers produced by the current `kdna pack` command. Pin a released CLI
  version when you need reproducible automation.
- **Agent support varies by platform.** The `kdna-loader` skill adapter supports
  discovery of local `.kdna` files. Agent-specific integration quality varies
  by agent runtime.

## Troubleshooting

If `kdna load ./minimal.kdna --as=prompt` returns an error, the expected
behavior is a human-readable message explaining which surface is currently
supported. If you see a stack trace or an unhelpful error, please
[open an issue](https://github.com/aikdna/kdna/issues).
