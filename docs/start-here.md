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
The native entry is CLI `0.39.0-rc.native-sections.3` with exact Core
`0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1`, container0.6 and
Read0.7-candidate. Prepare the complete twelve-archive delivery using the
[CLI generator](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md).
Source availability does not establish official npm publication; the registry
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
`0.8.0-rc.native-sections.1` with that same exact native CLI/SDK graph. Its npm
publication is disabled and named Host delivery remains NOT_RUN. Installing a
Skill or copying a process vector does not establish Host activation.

For Studio creation and local protection, use StudioCLI
`0.13.0-rc.components.2` / StudioCore `4.0.0-rc.components.2` and their complete
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
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Current source: inspect, validate, Read and static Plan/Capsule; published CLI 0.36.1 retains its separate packing/loading API |
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
