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
workflows. The same judgment can remain in any of them. KDNA adds value when it
needs independent identity, integrity, authorization, loading, and lifecycle.

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

A KDNA Cluster is the explicit advanced path: multiple assets can be assigned
roles, routed, checked for conflicts, and coordinated around one task. Cluster
does not replace the single-asset model, and the single-asset path does not
silently invoke Cluster routing.

## Open Creation, Contracted Consumption

Open protocol does not mean raw consumption. Authors use the KDNA toolchain to
create and package assets. Compatible Agent runtimes follow:

```text
inspect → LoadPlan → authorization → load/project → Runtime Capsule → Agent
```

Direct ZIP extraction, CBOR decoding, or raw payload parsing is a developer
inspection path, not a compatible Agent consumption path. This distinction is
what allows the same asset model to support public, licensed, and remote access.

## What “Verifiable” Means

KDNA can verify format, integrity, provenance, authorization state, and
optional evidence claims. It does not verify that a judgment is true or that
an author should be trusted. Consumers choose which assets and evidence fit
their own context.

## Try It

```bash
npm install -g @aikdna/kdna-cli
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

→ [Start Here](./start-here.md) · [KDNA and the AI Stack](./kdna-and-ai-stack.md) · [Core Narrative and Boundaries](./core-narrative-and-boundaries.md)
