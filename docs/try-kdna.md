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
loader. This is technical delivery evidence: the identified asset can be
validated, planned, and rendered for a Host. It does not by itself prove that
an Agent followed the asset or that the result became better.

A compatible Host should expose which exact asset is active, its scope, and why
it was attached, with controls to disable, switch, or roll back it.

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
- **Current AIKDNA reference display**: [kdna-assets](https://github.com/aikdna/kdna-assets) (current-format technical references, not content endorsements or the default onboarding path)
- **Current status**: [docs/status.md](./status.md)

## What KDNA Is

KDNA is an open file format for packaging domain judgment and loading it into AI agents. `.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the official KDNA toolchain.

KDNA Core is content-neutral. It validates file structure and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.
