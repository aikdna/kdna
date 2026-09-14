> **Pre-release ecosystem — versioned source and published contracts**
>
> KDNA is a judgment-asset container and ecosystem. This repository owns the
> protocol and Core runtime; companion repositories provide creation,
> consumption, authorization, Apple, Web, Agent, editor, and developer
> integrations. Existing packages are pre-release snapshots, not Beta, stable,
> GA, or a reason to retire an integration's mission.

# KDNA

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
Read under an independently trusted Host boundary. The published CLI 0.36.1
line retains its separate LoadPlan and Runtime Capsule contract. Directly
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

[![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE) [![Maturity: Pre-release](https://img.shields.io/badge/maturity-Pre--release-orange)](#maturity)

> **Maturity: Pre-release** — the container, toolchain, and integrations are
> being reconciled against their exact public contracts. Component maturity
> varies and must be stated per repository and version; no integration is
> declared valueless merely because it is outside one release wave. Check the
> exact version's schema, specification, fixtures, conformance, and release
> notes before use. See
> [`docs/maturity.md`](./docs/maturity.md).

## Current source: Core admission and Read

Start with the [Core/Read source guide](./docs/core-read-current-status.md) and
the exact [Core](./packages/kdna-core/README.md) and
[Read](./packages/kdna-read/README.md) package inputs. Core
`0.24.0-rc.component-semantics.2` admits immutable bytes, constructs Canonical IR
and issues a private snapshot. Read `0.3.0-rc.component-semantics.2` reports
`read_envelope`, `admission_rejection`, `no_body_control` or `transport_failure`.
Disclosure requires the embedding's trusted control and Host providers; it
does not authorize an action.

These are source candidates, not npm releases. Encryption, signature and
checksums-document admission, Runtime Capsule/Plan admission and execution are
unavailable in this Core/Read implementation. A schema or historical example
does not enable those capabilities. The [current CLI source](https://github.com/aikdna/kdna-cli#readme)
provides explicit-file `inspect`, `validate` and `read`; use its exact bound
dependency graph. Keep old-line assets and APIs in their original environment.

## Published CLI 0.36.1 walkthrough

Generate a demonstration for the published line, load its Runtime Capsule,
and then replace the demonstration judgment with your own. This preserves the
published workflow; it is not a current Core/Read quickstart.

This walkthrough is pinned to `@aikdna/kdna-cli@0.36.1`. The
commands below are part of that package's allowlist and were last re-run
against it on 2026-09-13. The unreleased Core/Read source candidate in this
repository has a different, narrower command set and rejects assets produced by
the published line, so do not mix the two. See
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

The asset repository preserves two historical reference assets. Their recorded
published-CLI validation does not transfer to current Core/Read, which rejects
them with `READ_CORE_INVALID`. Its separate current-contract
`@aikdna/verification-scope@0.1.5` candidate has no Release coordinate or human
review. See the [asset README](https://github.com/aikdna/kdna-assets#readme) for
exact bytes, observations and licenses. Listing is not endorsement.

→ [Full 5-minute guide](./docs/try-kdna.md) · [Public reference display](https://github.com/aikdna/kdna-assets)

## What is a KDNA file?

A `.kdna` file is a single, portable container. The following list describes
features of the published format contract, not the capabilities of every Core
implementation. In particular, current Core/Read rejects encryption, signatures
and checksums documents at admission. The published container contract includes:

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

Core format validity and Creation Engine acceptance are separate results. The
published Creation Output Boundary describes writer checksum and scoped
authoring requirements under its own contract; those requirements do not enable
checksum admission in the current Core candidate or redefine its accepted inputs. See [Creation Output Boundary](./specs/creation-output-boundary.md).

## Published Core 0.22.0 signing example

This example belongs only to `@aikdna/kdna-core@0.22.0` and its matching
published-line assets. Install that exact version in a separate project:

```sh
npm install --save-exact @aikdna/kdna-core@0.22.0
```

The current Core source does not export these signing APIs and rejects signed
containers. The signing specification and historical vectors remain valid
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

The table above retains the published loading-line roles. Current Core/Read
source uses admission and Read as described above; the direct-file
`validate → plan-load → load` path belongs to published CLI 0.36.1. The historical global package-store and
auto-discovery Skill experience is not a protocol requirement and is under
product recertification; it must not be treated as the default KDNA user model.

`@aikdna/kdna` remains a maintained compatibility bridge. New
integrations should install `@aikdna/kdna-cli` and `@aikdna/kdna-core`
directly. The complete package, source-only application, and release-artifact
inventory is published in the schema-2
[ecosystem manifest](./docs/ecosystem-manifest.md).

## Examples

See:

- [`examples/minimal/`](./examples/minimal/) — the smallest valid authoring source layout for producing a `.kdna` file
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
| [kdna-cli](https://github.com/aikdna/kdna-cli) | `@aikdna/kdna-cli` | KDNA runtime CLI |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | `@aikdna/kdna-studio-cli` | AI-powered authoring CLI |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | `@aikdna/kdna-studio-core` | Studio SDK for creators |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | `kdna-loader` (Unassessed); `@aikdna/kdna-mcp-server@0.5.0` (Experimental) | Agent and MCP adapter mission; not automatic judgment authority |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | — | Public asset releases |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Historical Swift release `0.20.0`; current source has its own binding | Current Core/Read source has macOS validation and generic iOS compilation; device runtime and native Host remain separate |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Historical Swift release `0.4.0`; current source has its own binding | Apple authoring kernel; historical release compatibility and current-source verification are separate, described by the owning README |
| [kdna-app-shared](https://github.com/aikdna/kdna-app-shared) | Historical Swift release `0.5.0`; current source has its own binding | Current Read presentation source has macOS builds/tests/consumers and generic iOS compilation; no device runtime or native Host claim |

Machine consumers should use [`ecosystem-manifest.json`](./ecosystem-manifest.json)
instead of inferring one package per repository.

## License

Apache 2.0. See [LICENSE](./LICENSE).
