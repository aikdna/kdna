# KDNA Agent Integrations

KDNA integrates with major AI coding agents through a single skill: `kdna-loader`. KDNA Core v1 assets are local `.kdna` files that can be validated and loaded on demand — they are not registered as separate skills.

## Supported Agents

| Agent | Skill Path |
|-------|-----------|
| **Claude Code** | `~/.claude/skills/kdna-loader/SKILL.md` |
| **Codex** (OpenAI) | `~/.codex/skills/kdna-loader/SKILL.md` |
| **OpenCode** | `~/.agents/skills/kdna-loader/SKILL.md` |
| **Cursor** | `~/.cursor/skills/kdna-loader/SKILL.md` |
| **GitHub Copilot** | Via `kdna-loader` skill (manual setup) |

## How It Works (the safe-by-default model)

The `kdna-loader` skill is a single instruction file (SKILL.md) that
teaches the agent the **protocol** for using KDNA. It does NOT
pre-load any domains; it does NOT scan all installed domains on every
request.

When you ask the agent a question, the agent decides per-task:

1. **Does this task need KDNA at all?** Most tasks (formatting,
   lookup, code execution) don't. Skip silently.
2. **What's available?** The agent or MCP server asks the KDNA toolchain for
   local `.kdna` assets and metadata. It does not unzip assets directly.
3. **What fits?** For each candidate domain, the agent uses CLI/Core-provided
   metadata and the asset's declared applicability boundaries.
4. **Load 0 or 1 primary domain.** If `does_not_apply_when` matches,
   the domain disqualifies itself. If two domains fit and disagree,
   the agent surfaces the choice to the user — never silently blends.
5. **Apply silently.** Once loaded, the agent reasons from the
   domain's axioms, but never quotes KDNA back to the user.

**Why this matters at scale**: a user with many `.kdna` files incurs no
context bloat. The agent inspects small metadata first and loads only the
compact judgment profile when a task calls for it.

For the full protocol, see [loader-behavior.md](./loader-behavior.md).

## Cross-Agent Compatibility

All agents can use the same local `.kdna` files. Validate once, load wherever
the runtime supports the loader:

```bash
kdna validate ./writing-v1.kdna
kdna plan-load ./writing-v1.kdna
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

If your agent uses a different default path, create a symlink:

```bash
ln -s ~/.kdna ~/.claude/Kdna
```

## Install

```bash
curl -fsSL https://aikdna.com/install | bash
```

Or manually:

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

Then install the `kdna-loader` skill for your agent from [kdna-skills](https://github.com/aikdna/kdna-skills).

## What's NOT installed as a skill

- KDNA domains themselves (they are `.kdna` assets, discovered and loaded on
  demand through the CLI/Core path)
- A domain creator. Use the Studio CLI for formal v1 `.kdna` creation; CLI dev
  scaffolds are non-canonical.
- Per-project pinning (the v0.7–v0.8 `.kdna/config.json` mechanism was
  removed in v0.9 because it forced loading on tasks the user didn't
  ask for, violating the "install ≠ load" safety model)
