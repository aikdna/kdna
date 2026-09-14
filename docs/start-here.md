# Start Here

**Judgment can live in many carriers. KDNA gives a selected judgment system a
portable asset and loading contract.**

KDNA is an open judgment-asset protocol. Anyone can create a `.kdna` asset.
The current source implementation uses public Core admission and Read under an
independently trusted Host boundary. Published CLI 0.36.1 retains its separate
LoadPlan and Runtime Capsule contract; the walkthrough below is pinned to that
published line.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **Use current Core and Read source** | [Current source entry](#current-source-entry) | 5 min |
| **Try the published CLI 0.36.1 lifecycle** | [Published walkthrough](#5-minute-quick-start) | 5 min |
| **Create my own KDNA** | [Current Studio CLI](https://github.com/aikdna/kdna-studio-cli#readme); [published-line authoring guide](./30-minute-authoring-guide.md) | 30 min |
| **Preserve personal judgment or preferences** | [Why KDNA](./why-kdna.md#whose-judgment) | 10 min |
| **Package professional expertise or creative taste** | [Why KDNA](./why-kdna.md#whose-judgment) | 10 min |
| **Build a team judgment asset** | [Enterprise Pilot](./enterprise-pilot.md) | 20 min |
| **Consume KDNA in my AI agent** | [Current source entry](#current-source-entry); [published loading-line guide](./15-minute-agent-guide.md) | 15 min |
| **Understand optional advanced runtime surfaces** | [Consumption Runtime](./consumption-runtime.md) | 20 min |
| **Assess a specific asset claim** | [Maturity and evidence](./maturity.md) | 10 min |
| **Understand the protocol** | [KDNA and the AI Stack](./kdna-and-ai-stack.md) | 15 min |
| **Contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) | 5 min |

---

## Current source entry

Read the [current Core/Read guide](./core-read-current-status.md), then the exact
[Core](../packages/kdna-core/README.md) and
[Read](../packages/kdna-read/README.md) package READMEs. Core admits captured
bytes into a private snapshot and Canonical IR. Read exposes four distinct
channels: `read_envelope`, `admission_rejection`, `no_body_control` and
`transport_failure`. Read permission comes from the embedding's trusted
providers and grants no action authority.

The current [CLI source](https://github.com/aikdna/kdna-cli#readme) offers
explicit-file `inspect`, `validate` and `read` with its exact bound source graph.
These candidates are not registry packages. Encryption, signatures and checksum
documents are unavailable at current Core admission; Plan and Runtime Capsule
admission and execution are also unavailable. Old-line demos and APIs must stay
with their matching published implementation. See the
[version matrix](./version-and-capability-matrix.md) before choosing an input.

## 5-Minute Quick Start

This is the published CLI **0.36.1** walkthrough. It preserves the older loading
contract and does not establish current Core/Read compatibility or Agent adoption.

```bash
npm install -g @aikdna/kdna-cli@0.36.1

# Generate, package, validate, and load an asset for this published line
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

Expected validation result for CLI 0.36.1:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

## Create your own asset

For current source creation, use the [Studio CLI README](https://github.com/aikdna/kdna-studio-cli#readme).
The example below instead pairs published Studio CLI **0.11.0** with Runtime
CLI **0.36.1**; its project/card and loading APIs belong to that older line.

```bash
npm install -g @aikdna/kdna-studio-cli@0.11.0 @aikdna/kdna-cli@0.36.1
kdna-studio create my-domain --name @yourscope/my-domain
kdna-studio card add my-domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when='["teaching KDNA to a new user"]' \
  --field does_not_apply_when='["only demonstrating CLI syntax"]' \
  --field failure_risk="Users may copy the format without preserving judgment." \
  --field confidence="high" \
  --field evidence_type="practice"
kdna-studio card approve my-domain --all --by your-id --statement "I confirm this judgment for export."
kdna-studio export my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

---

## What KDNA Is (and Isn't)

| KDNA makes first-class | KDNA does not claim |
|-------------------------|---------------------|
| A named, scoped judgment asset | That Prompt, Skill, RAG, Policy, or Memory cannot carry judgment |
| Format, identity, integrity, and version contracts | That asset content is true, good, or superior |
| Current Read disclosure; versioned published loading contracts | Tool permission or workflow execution authority |
| Cross-agent portability through a shared protocol | Guaranteed behavior improvement on every model or task |
| Optional provenance and lifecycle metadata | Ownership of all facts, methods, or reasoning |

Use KDNA when the judgment needs that independent asset contract. Keep using a
Prompt, Skill, document, Policy, or knowledge system when its own contract is
enough.

The current recommended user path starts from an explicit `.kdna` file. A Host
may remember an exact attachment after user approval, but a global library,
automatic discovery, and silent Skill loading are not required and do not
create authority.

---

## Repository Map

This repository owns the **KDNA judgment-asset specifications and reference implementation**.
The repositories below retain their missions; their published coordinates and
current source capabilities remain separate. Consult each owning README before
using a particular API:

| Repo | Role |
|------|------|
| [kdna](https://github.com/aikdna/kdna) | Official KDNA Core spec, toolchain entry, schemas, docs |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Current source: inspect, validate and Read; published CLI 0.36.1 retains packing/loading |
| [kdna-eval](https://github.com/aikdna/kdna/tree/main/packages/kdna-eval) | Replay, budget, and consumption-evaluation primitives |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Authoring CLI for creating and exporting `.kdna` assets |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Agent and MCP adapter mission; current loader Skill is Unassessed |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | Public reference-asset releases; technical examples, not content endorsements or the default onboarding path |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Current Core/Read source has macOS validation and generic iOS compilation; historical 0.20.0 conformance belongs to its own inputs |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Apple authoring kernel; historical 0.4.0 compatibility and current-source verification are separate; see the owning README |
| [kdna-app-shared](https://github.com/aikdna/kdna-app-shared) | Current Read presentation source has macOS builds/tests/consumers and generic iOS compilation; historical 0.5.0 retains its own release scope |

---

## Current State

The ecosystem is pre-release. Current Core/Read source, current creation source
and published loading packages have distinct inputs and proof limits. See
[Status](./status.md), [component reception](./component-reception-status.md)
and exact package release notes; source availability is not registry publication,
human acceptance or native Host verification.

A single explicitly selected KDNA asset is the foundation and default
consumption path. Published Cluster and policy commands are advanced surfaces
under recertification; they do not replace the single-file model.

For applications using the published loading line that need task-aware asset
selection, see the [Consumption Runtime guide](./consumption-runtime.md). It explains route,
bounded composition, projections, traces, and evaluation without changing the
`.kdna` file format.

---

New to KDNA? This page is your entry. Everything else links back here.
