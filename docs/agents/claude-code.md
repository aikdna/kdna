# KDNA + Claude Code

## Quick Install

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna doctor --agents
```

## Prepare a Packaged Asset

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

For a public example domain, start from its packaged `.kdna` file and release
card. Validate and plan-load that file before loading it into the agent.

## Verify It Works

Ask Claude Code a task where the loaded domain should matter:

```text
Review this blog post for structural quality.
```

Claude Code should apply the loaded judgment silently. You should not see
"According to KDNA axiom..." in the response; KDNA is context for judgment,
not text to quote back.

## Manual Loader Installation

If `kdna setup` doesn't detect Claude Code:

```bash
mkdir -p ~/.claude/skills/kdna-loader
cp ~/.kdna/skills/kdna-loader/SKILL.md ~/.claude/skills/kdna-loader/SKILL.md
```

## Common Issues

| Symptom | Fix |
|---|---|
| "KDNA not loaded" | Run `kdna setup` again, then load a local `.kdna` file with `kdna load` |
| "No assets found" | Validate and pass an explicit local `.kdna` path |
| "Skill outdated" | `kdna setup --force` to reinstall |
| Claude Code not detected | Install Claude Code, then `kdna setup --claude` |
