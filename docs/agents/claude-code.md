# KDNA + Claude Code

## Quick Install

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna doctor --agents
```

## Verify It Works

Ask Claude Code a writing review task:

```
"Review this blog post for structural quality."
```

Claude should:
1. Detect `@aikdna/writing` applies
2. Load the domain silently
3. Diagnose argument structure (not language)
4. Use preferred terms (not banned ones)
5. Run self-checks before responding

You should **never** see "According to KDNA axiom..." in the response. The judgment is applied silently.

## Check Installation

```bash
kdna doctor --agents
```

Expected output:
```
Claude Code: detected — kdna-loader installed (v2026.05)
```

## Manual Installation

If `kdna setup` doesn't detect Claude Code:

```bash
mkdir -p ~/.claude/skills/kdna-loader
cp ~/.kdna/skills/kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md
```

## Install More Domains

```bash
kdna list --available
kdna install code_review
kdna install agent_safety
```

## Common Issues

| Symptom | Fix |
|---------|-----|
| "KDNA not loaded" | Run `kdna setup` again |
| "No domains found" | Run `kdna install @aikdna/writing` |
| "Skill outdated" | `kdna setup --force` to reinstall |
| Claude Code not detected | Install Claude Code, then `kdna setup --claude` |
