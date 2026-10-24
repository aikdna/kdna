# Start Here

**Judgment can live in many carriers. KDNA gives a selected judgment system a
portable asset and loading contract.**

## Which line are you on? Read this first

Select one exact dependency graph. The [top-level entry](../README.md) and
[support matrix](current-release-support.md) distinguish three states:

| Line | Coordinates and acquisition | Status |
|---|---|---|
| Published stable distribution | Core `0.37.9`, Read `0.13.3`, CLI `0.43.2`, Studio Core `4.1.0`, Studio CLI `0.14.0`; each published from its reviewed source commit with a retained, byte-verified artifact | Published on `latest` |
| Published previews | See the five exact versions and separate tags in [published channel history](current-release-support.md#published-channel-history) | Existing immutable artifacts; not the current published bytes |
| Earlier `latest` observation | Core `0.37.0`, Read `0.11.1`, CLI `0.36.1`, Studio Core `3.0.0`, Studio CLI `0.11.0` | Observed on 2026-10-11; each keeps its own graph |

The registry recipe in the [current source entry](#current-source-entry) now
runs against the exact published versions. Use
`--omit=optional` for the bound protected Host graph; otherwise npm may add
`cbor-extract` and the Host rejects the unbound package.

The [current line quickstart below](#current-line-quickstart-cli-0432) runs
the published stable CLI `0.43.2` command surface. The older walkthroughs
further down preserve CLI `0.36.1` and its historical loading contract; for
current native or Studio authoring, follow the current source entry, retain
its lock, and use the reader named by the producing route.

## Current line quickstart (CLI 0.43.2)

Five commands from an empty directory create, check and read a real `.kdna`
asset with the **current published** CLI — `@aikdna/kdna-cli@0.43.2` with its
exact Core `0.37.9` / Read `0.13.3` pins. Every command below was re-run from
a clean directory with an empty npm cache.

```bash
mkdir kdna-first-asset && cd kdna-first-asset
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.2

# 1. Create a first asset from the bundled teaching example
npx --no-install kdna create node_modules/@aikdna/kdna-cli/examples/team-update/author.json --output first-asset.kdna --allow-create

# 2. Inspect: identity, contract tuple and digests (no judgment bodies)
npx --no-install kdna inspect first-asset.kdna

# 3. Validate: technical admission
npx --no-install kdna validate first-asset.kdna

# 4. Read the catalog: which judgments does this asset carry?
npx --no-install kdna read first-asset.kdna --mode catalog --budget 1000000 --allow-read

# 5. Read one judgment with its mandatory support closure
npx --no-install kdna read first-asset.kdna --mode exact_selection --asset-id asset:team-update-format --asset-version 1.0.0 --judgment-id update:order --budget 1000000 --allow-read
```

What you will see: `create` reports `status: "saved"` with the exact byte
length and SHA-256 (`1482397a…` for this deterministic example); `inspect`
and `validate` report `status: "accepted"` with `core: valid`; the catalog
lists the three judgment ids `update:order`, `update:evidence` and
`update:rationale`; and `exact_selection` returns the selected judgment's
statement together with its mandatory closure.

Notes:

- `--allow-create` and `--allow-read` are explicit per-invocation permissions
  for technical operations. They do not confirm the author, establish
  adoption, or authorize any action.
- `--budget` counts the complete final JCS read envelope, not the printed
  body. For the exact read contract and the authored-input format for
  `create`, see the [CLI README](https://github.com/aikdna/kdna-cli#readme).
- The example input is synthetic teaching content. To author your own
  `{manifest, payload, members}` document, start from the same README.
- `plan`/`load` and the older `demo`/`pack` commands are **unavailable on
  this line** (exit 2); they belong to the
  [historical CLI 0.36.1 walkthrough](#5-minute-quick-start) below.

---

KDNA is an open judgment-asset protocol. Anyone can create a `.kdna` asset.
The current source implementation uses public Core admission and Read under an
independently trusted Host boundary. Published CLI 0.36.1 retains its separate
LoadPlan and Runtime Capsule contract; the walkthrough below is pinned to that
published line.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **Try the current published CLI lifecycle** | [Current line quickstart (CLI 0.43.2)](#current-line-quickstart-cli-0432) | 5 min |
| **Use current Core and Read source** | [Current source entry](#current-source-entry) | 5 min |
| **Try the historical loading line (CLI 0.36.1)** | [Historical walkthrough](#5-minute-quick-start) | 5 min |
| **Create my own KDNA** | [Current native/Studio routes](#current-source-entry); [published-line authoring guide](./30-minute-authoring-guide.md) | 30 min |
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

Use the [current support and distribution matrix](./current-release-support.md)
and [matching-source guide](./core-read-current-status.md#choose-and-obtain-one-matching-delivery).
The native entry is CLI `0.43.2` with exact Core
`0.37.9` / Read `0.13.3`, container0.6 and
Read0.7-candidate. CLI `0.43.2` binds that exact companion graph; the
immediately preceding CLI `0.43.1` retains its own Core `0.37.8` / Read `0.13.2`
pins. Prepare the complete twelve-archive delivery using the
[CLI generator](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md).
Source availability and registry publication are separate facts; the registry
recipe in the [README](../README.md#current-source-choose-the-matching-implementation)
is conditional on those exact published versions.

For the first Agent task, use a Codex Agent's local tools with that exact CLI.
Explicitly identify the task, asset and permitted Read disclosure. The
[executed weekly-update example](../examples/native-team-update/README.md)
supplies licensed original/revised assets, synthetic facts, before/after task
outputs and the actual selected content's effect. Follow its Read and Source
recipe to reopen and revise while preserving the original. It establishes this
Agent's task use, not a real teammate's confirmation or named MCP Host adoption.

The [Loader/MCP source](https://github.com/aikdna/kdna-skills#readme) is
`0.8.0-rc.native-sections.3` with its own CLI `0.43.0` / Core `0.37.7` / Read
`0.13.1` graph. Its npm
publication is disabled and named Host delivery remains NOT_RUN. Installing a
Skill or copying a process vector does not establish Host activation.

For Studio creation and local protection, use StudioCLI
`0.14.0` / StudioCore `4.1.0` and their complete
source graph. This separate route uses container0.5 / Read0.6.4. Saved protected
consumption and revision use the [trusted local Host guide](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md),
not StudioCLI's static read command or native container0.6. Credentials and
permissions belong to the independently trusted launcher, not asset text.

Native CLI Plan/load is unavailable. The SDK's declared execution reference
exports and the published CLI0.36.1 loading walkthrough below remain separate.
Published Core `0.37.0`, Read `0.11.1`, native CLI `.2` and loading CLI `0.36.1`
retain their own artifacts and exact dependency graphs. Never substitute
`latest`, a global CLI or an older same-version archive for this source delivery.

## 5-Minute Quick Start

> **Historical (loading line, CLI 0.36.1).** This section preserves the
> published 2026-09 loading workflow (`demo` / `pack` / `plan-load` / `load`).
> On the current line these commands are unavailable (exit 2); start from the
> [Current line quickstart (CLI 0.43.2)](#current-line-quickstart-cli-0432)
> instead. This walkthrough preserves the older loading contract and does not
> establish current Core/Read compatibility or Agent adoption.

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

## Historical: create your own asset (Studio CLI 0.11.0 + CLI 0.36.1)

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
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Current native source: create, inspect, validate, Read and Source revision; native Plan/load unavailable; published CLI 0.36.1 retains its separate packing/loading API |
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
