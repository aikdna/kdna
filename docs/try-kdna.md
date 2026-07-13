# Try KDNA in 5 Minutes

Two paths. Start with the verified lifecycle, then author your own judgment.

## Path A: Verify the current lifecycle (recommended first)

Generate an asset with the installed CLI, validate it, and load a
toolchain-produced Runtime Capsule.

```bash
npm install -g @aikdna/kdna-cli

kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

**What you'll see:** a profile-selected Runtime Capsule produced by the KDNA
loader. Use it through a compatible Agent integration, then compare the result
with the same task without KDNA. Repeating asset vocabulary is not proof; look
for changed distinctions, boundaries, and decisions.

This is what KDNA does: the agent's reasoning shifts, not its tone.

## Path B: Create a minimal asset from scratch

Understand the format by building the smallest valid `.kdna` file.

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack   ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load   ./minimal.kdna --profile=compact --as=prompt
```

This proves the format works end-to-end. The output will be minimal — one placeholder axiom. That's expected. The format is correct; the judgment is the variable.

## What's next

- **Load into your AI agent**: [15-minute agent guide](./15-minute-agent-guide.md)
- **Create your own domain**: [30-minute authoring guide](./30-minute-authoring-guide.md)
- **Historical AIKDNA demonstrations**: [kdna-assets](https://github.com/aikdna/kdna-assets) (archived; not current-format onboarding assets)
- **Current status**: [docs/status.md](./status.md)

## What KDNA Is

KDNA is an open file format for packaging domain judgment and loading it into AI agents. `.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the official KDNA toolchain.

KDNA Core is content-neutral. It validates file structure and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.
