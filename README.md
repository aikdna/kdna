> **Pre-release ecosystem — versioned source and published contracts**
>
> KDNA is a judgment-asset container and ecosystem. This repository owns the
> protocol and Core runtime; companion repositories provide creation,
> consumption, authorization, Apple, Web, Agent, editor, and developer
> integrations. Component maturity is stated separately from package release
> coordinates; a distribution version does not establish ecosystem-wide GA.

# KDNA

<!-- release-coordinates:begin (generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand) -->
**Current publication state (2026-10-15).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.6` | `latest` | `17137ebdd316f5e44b64c6164d6fca07b0e8486b42b5eb6e85347d92ad25087f` |
| `@aikdna/kdna-read` | `0.13.0` | `latest` | `26f62bb703c7ad92acdfa02e44b3b981f73ec2e9c20bec29e1412937968170a7` |
| `@aikdna/kdna-cli` | `0.42.0` | `latest` | `8edc544208af12aa44e731a733aedc7ad6af0a4507e3d34ac6e5c5c5a1c08d00` |
| `@aikdna/kdna-studio-core` | `4.0.0` | `latest` | `062c35970e4c7e3ba49f8d9420f1e221a3ec007fac145d67c04fe5ee2e88be62` |
| `@aikdna/kdna-studio-cli` | `0.13.0` | `latest` | `8f1b0b8109d03c1678339f90fbf3c63ef20c4eb190004f0d4b8aabfff198415a` |

MCP remains a Git source channel (main `195be98b8e19c6173c60c06927b01a6930e1a90e`) and adds no
npm coordinate in this wave. Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
<!-- release-coordinates:end -->

Targeted support is the Node toolchain on **Linux and macOS** and a named local
Host (**Codex** or **OpenCode**) through the operator-bound stdio adapter.
**Windows is not claimed.** Platform targets are not execution receipts: the
previous preview's macOS arm64/Node 22.22.3 observations and repository CI do not
establish acceptance of these new artifacts. The new exact source, retained
archives and installed graphs each require their own checks.

Follow [Start Here](docs/start-here.md) and the matching candidate table below.
The complete static tuple, native execution 0.3.1 formats and reference APIs are
linked from [SPEC-INDEX](SPEC-INDEX.md#kdna-public-specification-index).
Historical contracts retain their coordinates and exact dependency graphs.

**No new interchange promise.** The Studio container `0.5` / Read `0.6.4`
route and native container `0.6` / Read `0.7.0` route remain separate.
Unsupported cross-read and automatic conversion are not added. Named Host
delivery, semantic adoption and real human acceptance require independent
records for the exact candidate; no historical test is promoted to that status.

> **KDNA gives reusable judgment its own identity and lifecycle.**
>
> KDNA is an open judgment-asset format and protocol. Individuals, teams,
> Agents, and tools can create bounded judgment assets whose versions,
> provenance, access, projections, and evidence can be managed independently
> from any one Prompt, Skill, model, or application.

Judgment can also remain in those carriers. Prompts and Skills can be
structured, versioned, tested, and reused; RAG and knowledge systems can store
or retrieve judgment. KDNA adds a standard asset and loading contract when the
judgment needs to move independently. Equivalent content may produce the same
behavior in another carrier, and KDNA does not claim otherwise.

Anyone can create a KDNA asset. Core admission establishes technical validity
of captured bytes; it does not authenticate authorship, judge content quality,
confirm adoption, or grant reading or action permission. The current source
implementation admits a private snapshot and exposes content through public
Read under an independently trusted Host boundary. The earlier published CLI
`0.36.1` line keeps its separate LoadPlan and Runtime Capsule contract, which
the current stable line does not change. Directly
unpacking or decoding asset internals is not a compatible consumption path.

> New to KDNA? → [Start Here](./docs/start-here.md)
>
> What IS KDNA, fundamentally? → [Core Narrative and Boundaries](./docs/core-narrative-and-boundaries.md)
>
> When does KDNA add value beyond an existing Prompt or Skill? → [Why KDNA](./docs/why-kdna.md) · [KDNA and the AI Stack](./docs/kdna-and-ai-stack.md)
>
> Building a consumption runtime? → [Consumption Runtime](./docs/consumption-runtime.md)
>
> Roadmap and contribution guide → [Public Roadmap](./docs/public-roadmap.md)
>
> This repo owns the **KDNA Core** specifications, schemas and reference implementation. Published packages and current source candidates have separate version contracts; source availability does not establish registry publication.

[![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE) [![Maturity: Pre-release](https://img.shields.io/badge/maturity-Pre--release-orange)](./docs/maturity.md)

> **Maturity: Pre-release** — the container, toolchain, and integrations are
> being reconciled against their exact public contracts. Component maturity
> varies and must be stated per repository and version; no integration is
> declared valueless merely because it is outside one release wave. Check the
> exact version's schema, specification, fixtures, conformance, and release
> notes before use. See
> [`docs/maturity.md`](./docs/maturity.md).

## Current source: choose the matching implementation

The [current support and distribution matrix](./docs/current-release-support.md)
and [Core/Read status](./docs/core-read-current-status.md) distinguish source,
package bytes, container contracts and actual public availability. This stable
distribution line remains an unpublished candidate until its exact release and
acquisition checks complete.
An existing `latest` package or repository `main` does not identify a candidate.

| Entry | Exact candidate package combination | Supported route |
| --- | --- | --- |
| Core/Read | Core `0.37.6` / Read `0.13.0` | Ordinary and Host-unlocked protected browser SDK; declared Node reference exports; Node >=20 |
| [Native CLI](https://github.com/aikdna/kdna-cli#readme) | CLI `0.42.0` with that exact Core/Read pair | Container `0.6.0`, Read `0.7.0-candidate`: create, save, inspect, validate, retained read and Source revision; Node >=22 |
| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.2` with that exact native CLI and Core/Read pair | Complete-source, operator-bound local stdio Read; named Host delivery/adoption `NOT_RUN` |
| [Studio session](https://github.com/aikdna/kdna-studio-cli#readme) | StudioCLI `0.13.0` / StudioCore `4.0.0` with that exact Core/Read pair | Complete-source session creation, revision, save/read/verify and explicit protected export; container `0.5.0`, Read `0.6.4` |

The maintained source currently carries the candidate pair Core `0.37.7` /
Read `0.13.1`, which the registry does not serve yet; until it does, the table
above lists only the published and byte-verified combination.

The two container routes have different reader and source APIs. Sharing SDK
package versions does not make their assets interchangeable. Use the reader
named by the producing route. Native CLI Plan/load remains unavailable. Neither
route runs a model, authenticates a person or grants action permission.

For a first Agent task, use a Codex Agent's local tool calls to the exact native
CLI in a prepared host. Supply the task, name the asset and explicitly permit
its Read disclosure; the Agent can then catalog and read exact selections before
writing or revising the task output. The executed
[synthetic weekly-update case](./examples/native-team-update/README.md) shows
that route, including before/after output and an Agent-authored Source revision.
It establishes one Agent's use on one synthetic task. It does not establish MCP
delivery, named Host activation or real-human confirmation. Local tool calls
also do not attest where the Agent's model processes disclosed content.

For native authoring, obtain the complete source from the
[CLI repository](https://github.com/aikdna/kdna-cli#readme) and follow its
[delivery generator](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md).
Its complete delivery includes twelve exact archives, a relative-file lock,
source-member receipt and license texts. The bundled public synthetic
[author example](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md)
and [executable recipe](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs)
create an original, disclose exact selections, make a substantive Source revision,
reopen the revised file and check that the original remains unchanged. No private
Reader input or author transcript is required.

Once official registry metadata confirms the exact stable versions, a separate
empty-cache registry installation can use:

```sh
mkdir kdna-native-example
cd kdna-native-example
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.42.0
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output
```

Keep the resulting lock and all previous files. A registry installation and an
offline source delivery have separate locks; each must bind the same declared
KDNA package bytes. The [stable release procedure](./docs/release-stable.md)
requires new byte-bound versions and a genuine stable release event. Publication
moves only the approved package's `latest` after its exact dependency graph is
available. Existing preview artifacts and tags retain their own scope.

The canonical [Loader](https://github.com/aikdna/kdna-skills/blob/main/kdna-loader/SKILL.md)
and [Creator](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/SKILL.md)
select these explicit routes. This repository's [`skills/`](./skills/README.md)
is a historical compatibility copy. Local stdio does not attest where a model
runs or authorize onward disclosure. Current Read requires trusted Host control,
matching scope/snapshot/digests, sufficient budget and confirmed delivery.

Published Core `0.37.0` / Read `0.11.1` retain their own contracts and artifacts.
Historical native CLI `0.39.0-rc.native-sections.2` binds Core
`0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`; loading CLI `0.36.1` binds Core
`0.21.0` and `cbor-x` `1.6.4`. Do not inject a new SDK pair into either older
installation. CLI `.2` and `.3` remain published previews; the published stable
line is `0.42.0`, which must not overwrite either preview. The separate Studio ordinary/protected guide
supplies its own preparation, trusted Host/credential boundary and readback
instructions; named Host delivery and independent acceptance remain `NOT_RUN`.
Technical checks and
scripted examples do not establish human confirmation, editorial fitness or
actual task adoption.

## Published CLI 0.36.1 walkthrough

Generate a demonstration for the published line, load its Runtime Capsule,
and then replace the demonstration judgment with your own. This preserves the
published workflow; it is not a current Core/Read quickstart.

This walkthrough is pinned to `@aikdna/kdna-cli@0.36.1`. The
commands below are part of that package's allowlist and were last re-run
against it on 2026-09-13. The current Core/Read pair is the published stable
Core `0.37.6` / Read `0.13.0`.
It has a different asset contract. The current native CLI route also has
different command forms, so this published walkthrough does not select that
new graph. Keep its exact historical dependencies. See
[tool status matrix](./docs/tool-status-matrix.md) for the per-command picture.

```bash
npm install -g @aikdna/kdna-cli@0.36.1

# Step 1: generate and package an asset for this published line
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna

# Step 2: verify the loading contract and receive a Runtime Capsule
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

> **Official package coordinates:** all official npm packages are published
> under the **`@aikdna`** scope (for example `@aikdna/kdna-cli` and
> `@aikdna/kdna-core`). The bare `kdna` name on npm is an unrelated
> third-party placeholder — do not install it. On PyPI, the `kdna` project
> name is likewise an unrelated third-party placeholder, not ours. Our
> official Python distribution on PyPI is **`aikdna`** (the import package
> name remains `kdna`). Install only `aikdna` from PyPI — never
> `pip install kdna`. See [SECURITY.md](./SECURITY.md).

The asset repository's historical `references/public` corpus and
`index/current.json` are retained solely as isolated engineering regression
inputs as of 2026-09-23. They are not the current formal business asset
collection; the current single formal work is created and independently
accepted separately. See [engineering isolation](https://github.com/aikdna/kdna-assets/blob/main/references/public/ENGINEERING-ONLY.md).

The two preserved historical references retain their original bytes and
licenses. Their recorded published-CLI validation does not transfer to the
current asset-adapter graph, which rejects them with `READ_CORE_INVALID`.
The earlier-contract `@aikdna/verification-scope@0.1.5` candidate is likewise
an engineering input, with no Release coordinate or human review. See the
[asset README](https://github.com/aikdna/kdna-assets#readme) for exact bytes,
observations and licenses. Listing is not endorsement.

→ [Full 5-minute guide](./docs/try-kdna.md) · [Historical engineering reference inputs](https://github.com/aikdna/kdna-assets)

## What is a KDNA file?

A `.kdna` file is a single, portable container. The following list describes
features of the published format contract, not the capabilities of every Core
implementation. In particular, ordinary current Core/Read root/browser admission rejects
protected inputs; explicit Node protection uses its separately bound contract. The published container contract includes:

- a **public manifest** (`kdna.json`) — the asset's identity and metadata
- a **judgment payload** (`payload.kdnab`) — the actual structured judgment data
- optional **encryption for licensed entries** — encrypted judgment payload with in-memory-only decryption in the supported published JS Core/CLI line; optional watermarking remains future work
- an optional **signature** (`signature.kdsig`) — an Ed25519 signature bundle (`kdsig.ed25519`, RFC-0021 M1) over the canonical content digest; verified offline and fail-closed during validation and loading. It attests integrity and provenance, not content endorsement
- **version and lineage information** — for traceability across releases
- a **runtime load contract** — describes how the official KDNA loader may read the asset
- optional **attachments** — supplementary files referenced from the payload
- an optional **checksums file** — per-entry digests for integrity checks

`.kdna` files are produced and consumed through a matching toolchain contract.
The format is content-neutral: technical admission does not rank judgment
quality, endorse an asset or grant permission. A successful `validate` describes
that exact version's checks; it is not acceptance by a different implementation.

That optional signature is a capability of the format contract, not of every
route. In this batch only some routes can honour it: the published Core `0.22.0`
line and its matching assets (see the signing example below), and the Studio
protected-Host route described by its own package. The current **native Agent
route** — `kdna create` in `@aikdna/kdna-cli` followed by an operator-bound
local MCP read — is **unsigned**: `create` writes no `signature.kdsig` member
and the Read adapter does not verify signatures, so integrity on that route
rests on the canonical content digest computed at creation, which is not a
signature or an endorsement. The published browser Inspector page
(`docs/inspector/`) is narrower still: it inlines
`@aikdna/kdna-web-client@0.3.0`, reads the published `0.2` container line
(`payload.kdnab`) only, verifies container shape rather than signatures, and
reports a current native asset as unreadable by that page with the CLI route to
use instead.

Core format validity and Creation Engine acceptance are separate results. The
published Creation Output Boundary describes writer checksum and scoped
authoring requirements under its own contract; those requirements do not enable
checksum admission in ordinary current Core APIs or redefine their accepted inputs. See [Creation Output Boundary](./specs/creation-output-boundary.md).

## Published Core 0.22.0 signing example

This example belongs only to `@aikdna/kdna-core@0.22.0` and its matching
published-line assets. Install that exact version in a separate project:

```sh
npm install --save-exact @aikdna/kdna-core@0.22.0
```

The current Core root does not export these historical signing APIs; ordinary
admission rejects signed containers. The explicit Node protection entry is a
separate API and does not make this example a current-source recipe. The signing specification and historical vectors remain valid
records of their own version contract.

In the published Core 0.22.0 line, a `.kdna` asset can carry an optional `signature.kdsig` bundle
(`kdsig.ed25519`, [RFC-0021](./rfcs/RFC-0021-signature-track.md) M1). The
Ed25519 signature covers the canonical content digest
([CANONICALIZATION.md](./docs/CANONICALIZATION.md)), verification is fully
offline, and loading is fail-closed: an asset whose signature does not verify
is rejected, never downgraded to "unsigned".

```js
const {
  generateSigningKeyPair,
  signKDNA,
  verifyKDNASignature,
} = require('@aikdna/kdna-core');

// Author side: sign a packaged asset (keep the private key secret).
const key = generateSigningKeyPair();
const signed = await signKDNA('./judgment.kdna', key.private_key, {
  outputPath: './judgment.signed.kdna',
});

// Consumer side: verify offline. Throws on any verification failure.
const evidence = await verifyKDNASignature('./judgment.signed.kdna');
// evidence.state === 'verified', evidence.key_fingerprint, evidence.content_digest

// Pin the signer key to reject signatures from any other key:
await verifyKDNASignature('./judgment.signed.kdna', {
  expectedPublicKey: key.public_key,
});
```

Signature absence alone does not invalidate a published-line asset; verification
reports `state: 'absent'`, and callers can require a signature instead. A valid signature proves integrity and key-bound
provenance only — it never proves the judgment is correct, expert, or safe.
Historical JS and Python implementations share deterministic known-answer
vectors under [`conformance/signature/`](./conformance/signature/README.md).
The [current Python source](./python-sdk/README.md) has its own Core/Read
boundary and does not inherit the historical signing capability.

## What KDNA Core defines

This repository is the **format authority**. Its versioned specifications define
the following contracts; the existence of a specification does not establish
implementation or acceptance in the current source candidate:

- the **file format** (container layout, mimetype, required entries)
- the **manifest schema** (`kdna.json` shape and required fields)
- the **current payload profile schema**
- the **encryption profile** for licensed entries (AEAD envelope over `payload.kdnab`)
- the **signature and digest metadata** used for integrity and provenance (canonical content digest; the `kdsig.ed25519` asset signature profile of RFC-0021 M1)
- the **version chain metadata** (lineage, judgment version, compatibility)
- the **runtime loading contract** (load profiles, decryption requirements, token hints)

KDNA Core is also the **toolchain reference**. The recommended way to produce, validate, load, and consume `.kdna` files is through the official KDNA toolchain.

## Authorization And Native Apps

The published line's protected, licensed, remote and native-app loading
contracts remain documented here. These links preserve their versioned
requirements; they do not claim current Core/Read implementation or native Host
acceptance:

- [Authorization contract](./specs/kdna-authorization-contract.md)
- [LoadPlan schema](./specs/kdna-loadplan.schema.json)
- [Runtime projection](./specs/kdna-runtime-projection.md)
- [Import security](./specs/kdna-import-security.md)
- [Apple native runtime integration](./docs/apple-native-runtime-integration.md)
- [SPEC-INDEX: every normative specification](./SPEC-INDEX.md)

In the published Core 0.22.0 line, ordinary loading remains fail-closed for
`access: "remote"`. Self-hosted
Runtime deployers that control the packaged server-side asset use the explicit
`@aikdna/kdna-core/remote-runtime` package subpath to obtain one full Capsule
for server-side projection. That API is not a client loading shortcut, an
identity or entitlement service, a content-confidentiality mechanism against
the deployer, or an AIKDNA-hosted endpoint. See [Remote access](./docs/REMOTE_MODE.md).

## What KDNA Core does not define

KDNA Core is **content-neutral**. It does not define:

- **content quality** — what judgment is correct, complete, or high-value
- **author trust** — whether an author is credible or endorsed
- **official recommendations** — which assets should be used in production
- **distribution** — how third parties host, list, recommend, or sell assets
- **runtime policy** — what a loader should do with an asset at runtime (block, allow, warn)
- **content governance** — moderation, takedown, ranking, certification

KDNA Core also does not make an experimental routing or composition decision
part of the asset format. Applications may exchange route cards, consumer
indexes, traces, and evaluation evidence as versioned sidecars. Those
artifacts describe how an asset was considered for a task; they do not change
the asset's judgment payload or make a recommendation on behalf of KDNA Core.

These are concerns of **external** platforms and policies. KDNA Core supplies the verifiable primitives and the official toolchain (as a reference implementation); everything else is out of scope.

Use the official public API and the exact implementation's version contract.
Current source integrations consume Core snapshots and public Read; integrations
with the published loading line must implement its LoadPlan, authorization,
integrity and Runtime Capsule contracts. Passing technical validation alone
does not make a raw decoder a compatible consumer.

## Official KDNA toolchain

The ecosystem includes published toolchain packages and public source candidates.
Each must implement its declared specification and exact dependency contract;
its source version, protocol coordinate and publication state are separate facts.

| Component | Role | Source |
| --- | --- | --- |
| **KDNA Core spec** | Format, schemas, runtime loading contract | this repo |
| **KDNA CLI** | Official command-line entry: `inspect`, `validate`, `pack`, `unpack`, `load` | this repo + `@aikdna/kdna-cli` |
| **KDNA Loader** | Official runtime loader for AI agents | `packages/kdna-core/` + `@aikdna/kdna-cli` |
| **KDNA SDK** | Embeddable library for integrations | `packages/kdna-core/` |
| **KDNA Eval** | Experimental replay, budget, and consumption-evaluation primitives | `packages/kdna-eval/` + `@aikdna/kdna-eval` |

The table above retains the published loading-line roles. The native asset CLI
uses `create → read` and explicit Source revision as described above. Core/Read
reference Plan/Capsule APIs remain independent; they do not enable Plan/load in
that CLI. The direct-file `validate → plan-load → load --profile=compact --as=json` path
belongs to published CLI 0.36.1. The historical global package-store and
auto-discovery Skill experience is not a protocol requirement and is under
product recertification; it must not be treated as the default KDNA user model.

`@aikdna/kdna@0.14.0` retains its historical compatibility contract. New
integrations should install `@aikdna/kdna-cli` and `@aikdna/kdna-core`
directly. The complete package, source-only application, and release-artifact
inventory is published in the schema-2
[ecosystem manifest](./docs/ecosystem-manifest.md).

## Examples

See:

- [`examples/minimal/`](./examples/minimal/) — the smallest valid authoring source layout for producing a `.kdna` file
- [`examples/native-team-update/`](./examples/native-team-update/) — one executed Codex Agent task on synthetic facts, with disclosed preferences, before/after output and an attributed Source revision
- [`fixtures/`](./fixtures/) — conformance and test fixtures

## Repository layout

```
kdna/
├── packages/             # kdna-core (loader), kdna-eval (scoring harness)
├── schema/               # JSON Schemas for manifest, payload profile, checksums, ...
├── docs/                 # Spec, architecture, guides
│   ├── core/             # Core format and runtime-contract docs
│   ├── tools/            # Per-tool documentation
│   ├── examples/         # Example guides
│   └── guides/           # How-to guides
├── examples/             # Authoring source layouts used to produce `.kdna` files
├── fixtures/             # Conformance test fixtures
├── conformance/          # Conformance test runner
├── rfcs/                 # Accepted and proposed RFCs
└── specs/                # Normative specifications
```

## Versioning

Toolchain packages follow [SemVer 2.0](https://semver.org/). Package versions
are release identifiers, not competing KDNA product formats. There is one
current KDNA Asset Container; technical compatibility identifiers such as
`format_version` are defined by the schemas and specification. Breaking protocol
changes require an RFC and an explicit migration path.

## Ecosystem

| Repo | Package | Purpose |
|------|---------|---------|
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Published CLI `0.42.0` on `latest`; native previews and the earlier `0.36.1` loading line retained | Native authoring, explicit Read and Source revision; exact current SDK pair above |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Published StudioCLI `0.13.0` on `latest`; historical npm `0.11.0` retained | Terminal creation session; container `0.5.0` / Read `0.6.4`, separate from native CLI |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Published StudioCore `4.0.0` on `latest`; historical npm `3.0.0` retained | Studio session SDK and explicit protected export; its own Host/credential boundary |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Loader/Creator source; MCP `0.8.0-rc.native-sections.2` unpublished by policy; historical npm MCP `0.5.0` | Matched published native `0.42.0` graph; operator-bound local stdio, named Host delivery/adoption `NOT_RUN` |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | — | Public asset releases |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Historical Swift release `v0.21.0`; current source has its own binding | Swift-native Core/Read contract with macOS validation and generic iOS compilation; no JavaScript preview parity, device runtime or native Host claim |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Historical Swift release `0.4.0`; current source has its own binding | Apple authoring kernel; historical release compatibility and current-source verification are separate, described by the owning README |
| [kdna-app-shared](https://github.com/aikdna/kdna-app-shared) | Historical Swift release `0.5.0`; current source has its own binding | Current Read presentation source has macOS builds/tests/consumers and generic iOS compilation; no device runtime or native Host claim |

Machine consumers should use the versioned
[`ecosystem-manifest.json`](./ecosystem-manifest.json) records rather than infer
one package per repository. The [current support matrix](./docs/current-release-support.md)
separately identifies current source combinations and existing public channels.

## License

Apache 2.0. See [LICENSE](./LICENSE).
