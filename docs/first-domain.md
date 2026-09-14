# Your First Domain

> Commands on this page use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

> Short guide. For a detailed end-to-end walkthrough, see [First Domain Walkthrough](./first-domain-walkthrough.md).

Build a working KDNA judgment asset in 10 minutes and see how it can be
validated and loaded.

## Step 1: Install

```bash
npm i -g @aikdna/kdna-cli@0.36.1
```

## Step 2: Create a Dev Source Workspace

```bash
kdna demo minimal ./my-domain
```

This creates a minimal authoring source directory with `mimetype`, `kdna.json`,
`payload.kdnab`, and `checksums.json`. For real authoring, use the Studio CLI
producer path in [30-minute-authoring-guide.md](./30-minute-authoring-guide.md).

## Step 3: Inspect

```bash
kdna inspect ./my-domain
```

You'll see the asset ID, title, version, payload path, and load profiles.

## Step 4: Pack and Validate

```bash
kdna pack ./my-domain ./my-domain.kdna
kdna validate ./my-domain.kdna
```

Validation should return `overall_valid: true`.

## Step 5: Load the Judgment Context

```bash
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

This emits agent-readable context describing argument structure, boundaries,
failure modes and self-checks. Whether a Host supplies that context and an Agent
uses it requires separate observation.

## Step 6: Create Your Own Formal Domain

The source directory above is a generated fixture. Create your authored project
in a new directory by following the complete
[30-minute authoring guide](./30-minute-authoring-guide.md), including judgment
material, explicit confirmation and export. Reusing the generated source
directory as a new Studio project fails, and an empty project cannot be exported.

**Next step:** [Loader Behavior](./loader-behavior.md) — understand how agents should use KDNA.
