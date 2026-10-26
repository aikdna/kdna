# Try KDNA in 5 Minutes

> **This guide is pinned to the historical loading line (CLI 0.36.1).** For the
> current published line (CLI `0.43.2`), use the
> [Current line quickstart](./start-here.md#current-line-quickstart-cli-0432).
> Commands below use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

Two paths. Start with the verified lifecycle, then author your own judgment.

## Path A: Verify the published CLI 0.36.1 lifecycle

Generate an asset with the installed CLI, validate it, and load a
toolchain-produced Runtime Capsule.

```bash
npm install -g @aikdna/kdna-cli@0.36.1

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
npm install -g @aikdna/kdna-cli@0.36.1
kdna demo minimal ./minimal
kdna pack   ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load   ./minimal.kdna --profile=compact --as=prompt
```

This proves the format works end-to-end. The output will be minimal — one placeholder axiom. That's expected. The format is correct; the judgment is the variable.

## What's next

- **Historical loading follow-up**: [15-minute agent guide](./15-minute-agent-guide.md)
  also belongs to the CLI `0.36.1` line; it does not describe current CLI
  `0.43.2` delivery.
- **Historical authoring follow-up**: [30-minute authoring guide](./30-minute-authoring-guide.md)
  keeps the older project/card workflow; current authoring starts from the
  [Current line quickstart](./start-here.md#current-line-quickstart-cli-0432).
- **Reference assets**: [kdna-assets](https://github.com/aikdna/kdna-assets) is a historical engineering reference. It currently lists no public asset and its release downloads are withdrawn — no public sample asset is obtainable from it yet. No content endorsement.
- **Current status**: [docs/status.md](./status.md)

## What KDNA Is

KDNA is an open file format for packaging domain judgment and loading it into AI agents. On this historical line, `.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the official KDNA toolchain. The current CLI `0.43.2` line does not provide the `plan-load` or `load` commands; use the [Current line quickstart](./start-here.md#current-line-quickstart-cli-0432) for its create/inspect/validate workflow.

KDNA Core is content-neutral. It validates file structure and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.
