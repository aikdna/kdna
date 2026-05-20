# KDNA Agent Integrations

KDNA integrates with major AI coding agents through the kdna-skills system. All integrations share a single KDNA root directory: `~/.kdna/`.

## Supported Agents

| Agent | Skill Path | Notes |
|-------|-----------|-------|
| **Claude Code** | `~/.claude/skills/kdna-loader/SKILL.md` | Anthropic — runs `kdna-loader` skill on every request |
| **Codex** (OpenAI) | `~/.codex/skills/kdna-loader/SKILL.md` | OpenAI — same skill, different directory |
| **OpenCode** | `~/.agents/skills/kdna-loader/SKILL.md` | Open-source agent |
| **Cursor** | `~/.cursor/skills/kdna-loader/SKILL.md` | AI-native code editor |
| **GitHub Copilot** | Via `kdna-loader` skill | Manual skill setup |

## How It Works

The kdna-loader skill is a plain text instruction file (SKILL.md) that tells the agent:

1. Look for KDNA domains in `~/.kdna/`
2. Match user request keywords against domain manifests
3. Load matched domain's Core + Patterns into context
4. Apply axioms, stances, frameworks, and self-checks silently

No API keys, no network calls, no runtime dependency. The skill is pure instruction text.

## Cross-Agent Compatibility

All agents share the same `~/.kdna/` directory. Install KDNA domains once, use them everywhere:

```bash
kdna install writing
# Now available in Claude Code, Codex, Cursor, and OpenCode
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
npm install -g @knowledge-dna/kdna
kdna install writing
```

Then install the loader skill for your agent from [kdna-skills](https://github.com/knowledge-dna/kdna-skills).
