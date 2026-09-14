# KDNA Agent Integrations

> Commands on this page use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

## Current source adapters

The current [Skills and MCP source](https://github.com/aikdna/kdna-skills#readme)
uses explicit local catalog, selection and public Read through its exact bound
Core/Read/CLI graph. It has no legacy loading fallback. Local source and packed
stdio checks do not establish native Host installation, delivery or semantic
adoption; those remain separate verification requirements.

Start from an explicit user-selected file or an exact Host-approved attachment.
Expose the asset identity and scope, preserve user controls, and never infer
permission from file presence or adapter installation.

## Published CLI 0.36.1 manual handoff

This separate older-line workflow generates a Runtime Capsule:

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna validate ./asset.kdna --runtime
kdna plan-load ./asset.kdna --json
kdna load ./asset.kdna --profile=compact --as=json
```

A successful command produces a Capsule on stdout. Host receipt and model
adoption require their own observations. The `inspect → plan-load → load`
sequence belongs to this published line; it is not the command contract of the
current Skills/MCP adapter.

Do not treat `kdna setup`, Skill-file presence, global discovery or silent
loading as proof of a correct Host integration. See
[Agent Adapter Behavior](./loader-behavior.md) for the shared selection and
authority boundaries and the versioned published sequence.
