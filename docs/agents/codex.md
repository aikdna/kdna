# KDNA + OpenAI Codex

## Quick Install

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna doctor --agents
```

## Prepare a v1 Asset

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

For a real domain, use a v1 artifact such as `writing-v1.kdna` and validate it
before loading:

```bash
kdna validate ./writing-v1.kdna
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

## Verify It Works

Ask Codex a task where the loaded domain should matter:

```text
Review this blog post for structural quality.
```

Codex should apply the loaded judgment silently. You should not see "According
to KDNA axiom..." in the response; KDNA is context for judgment, not text to
quote back.

## Manual Loader Installation

If `kdna setup` doesn't detect Codex:

```bash
mkdir -p ~/.codex/skills/kdna-loader
cp ~/.kdna/skills/kdna-loader/SKILL.md ~/.codex/skills/kdna-loader/SKILL.md
```

## Common Issues

| Symptom | Fix |
|---|---|
| "KDNA not loaded" | Run `kdna setup` again, then load a local `.kdna` file with `kdna load` |
| "No assets found" | Validate and pass an explicit local `.kdna` path |
| "Skill outdated" | `kdna setup --force` to reinstall |
| Codex not detected | Install Codex, then `kdna setup --codex` |
