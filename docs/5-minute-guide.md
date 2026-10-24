# KDNA 5-Minute Guide

> **This guide is pinned to the historical loading line (CLI 0.36.1).** For the
> current published line (CLI `0.43.2`), use the
> [Current line quickstart](./start-here.md#current-line-quickstart-cli-0432).
> Commands below use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

This page is kept as a stable link. The published-line walkthrough is:

→ [Try KDNA in 5 Minutes](./try-kdna.md)

## Published CLI 0.36.1 path

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

This creates a local `.kdna` file, validates it, confirms the LoadPlan, and
renders compact judgment context for an AI agent.
