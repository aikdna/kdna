# Why KDNA?

General-purpose models already contain broad knowledge and useful default
judgment. But a model's defaults are not necessarily the judgment of the
person, creator, professional, team, or organization using it.

KDNA exists so that judgment can be made explicit, carried across models, and
used through a consistent runtime contract.

## The Judgment Asset Contract

Facts, memory, Skills, workflows, Policies, Prompts, and evaluations can all
carry judgment. Their primary contracts differ, and none has an exclusive
claim over a content type.

KDNA makes the following judgment content first-class in one asset:

- what matters most;
- which distinctions must not be blurred;
- what should block action;
- which trade-offs and values govern a choice;
- what good work looks like to this author or group;
- when the judgment does not apply.

KDNA does not replace data governance, memory, private compute, RAG,
evaluation infrastructure, fine-tuning, Skills, Prompts, Policies, or
workflows. The same judgment can remain in any of them. KDNA adds more than one
kind of value: the creation process itself — clarifying the judgment, forming
it, and expressing it — is value, and publishing it makes the standard visible
and usable to others. Independent identity, integrity, authorization, loading,
and lifecycle add a further layer when the judgment needs them. Reuse and
loading are not the only sources of value.

## Whose Judgment?

KDNA is not limited to institutions or credentialed experts.

- An individual can preserve preferences, values, boundaries, and ways of
  choosing.
- A creator can preserve taste, voice, editorial standards, and what they
  refuse to make.
- A professional can package diagnostic distinctions, risk thresholds, and
  methods of trade-off.
- A team or organization can version shared operating standards without
  baking them into one model or application.
- An Agent or tool can create a KDNA asset through the same public protocol;
  author identity does not determine format validity.

Anyone can create and publish a KDNA asset. KDNA Core does not decide whether
its judgment is true, good, expert, or useful. Optional evidence can describe
what an asset has been observed to do; it is not a creation license.

## One Asset and Multiple Assets

A single KDNA asset is the atomic, default path: one scoped judgment asset is
created, validated, authorized, and loaded for a task.

A KDNA Cluster is an experimental advanced surface under recertification.
Multiple assets require an explicit Host policy and user-approved candidate
set. Cluster does not replace the single-asset model, and the single-asset path
does not silently invoke Cluster routing.

## Open Creation, Contracted Consumption

Open protocol does not mean raw consumption. Authors use the KDNA toolchain to
create and package assets. Current source consumers use public Core admission
and Read under independently trusted Host providers. The published CLI 0.36.1
loading line instead follows:

```text
inspect → LoadPlan → authorization → load/project → Runtime Capsule → Agent
```

Direct ZIP extraction, CBOR decoding, or raw payload parsing is a developer
inspection path, not a compatible Agent consumption path. This distinction is
part of the published loading line's public, licensed and remote access contract.
Those access modes do not enable encrypted admission in current Core/Read.

## What “Verifiable” Means

Each implementation verifies only its declared version contract. Current Core
admission establishes technical validity of captured bytes; it does not
authenticate provenance or grant permission. The published loading line also
contains version-specific integrity, provenance and authorization checks. It does not verify that a judgment is true or that
an author should be trusted. Consumers choose which assets and evidence fit
their own context.

## Try the published CLI 0.36.1 line

For current source, use [Core/Read](./core-read-current-status.md). The walkthrough below keeps
its older loading contract and matching assets.

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

→ [Start Here](./start-here.md) · [KDNA and the AI Stack](./kdna-and-ai-stack.md) · [Core Narrative and Boundaries](./core-narrative-and-boundaries.md)
