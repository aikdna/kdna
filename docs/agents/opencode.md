# KDNA + OpenCode

## Quick Install

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna doctor --agents
```

## Verify It Works

Ask OpenCode a writing review task:

```
"Review this blog post for structural quality."
```

OpenCode should:
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
OpenCode: detected — kdna-loader installed (v2026.05)
```

## Manual Installation

If `kdna setup` doesn't detect OpenCode:

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp ~/.kdna/skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
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
| OpenCode not detected | Install OpenCode, then `kdna setup --opencode` |
