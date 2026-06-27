# KDNA

> **KDNA is an open file format for packaging scoped judgment and loading it into AI agents.**

Use the official KDNA toolchain to create, inspect, validate, plan-load, and load `.kdna` files. Agents and third-party tools can create `.kdna` files through the official SDK or CLI; format validity is determined by `kdna validate`, not by author identity.

> New to KDNA? → [Start Here](./docs/start-here.md)
>
> This repo defines **KDNA Core** — the file format, schemas, and runtime loading contract. The official KDNA toolchain is published from this repo and its companion packages.

[![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

## Try KDNA Core v1 in 5 minutes

Create a local `.kdna` file, validate it, and render agent-ready judgment context from your terminal.

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

→ [Full 5-minute guide](./docs/try-kdna.md)

## What is a KDNA file?

A `.kdna` file is a single, portable container that holds:

- a **public manifest** (`kdna.json`) — the asset's identity and metadata
- a **judgment payload** (`payload.kdnab`) — the actual structured judgment data
- optional **encryption envelope metadata** — to mark encrypted entries
- optional **signatures** (`signature.kdsig`) — author / publisher attestations over the payload (OPTIONAL until 2027-Q1, REQUIRED after; see SPEC §3.2)
- **version and lineage information** — for traceability across releases
- a **runtime load contract** — describes how the official KDNA loader may read the asset
- optional **attachments** — supplementary files referenced from the payload
- an optional **checksums file** — per-entry digests for integrity checks

`.kdna` files are produced by authors through the KDNA toolchain and consumed by the KDNA loader. The format itself is content-neutral — KDNA Core does not rank judgment quality or endorse specific assets. Agents can create `.kdna` files through the official SDK; any file that passes `kdna validate` is a valid KDNA asset.

## What KDNA Core defines

KDNA Core is the **format authority**. It defines:

- the **file format** (container layout, mimetype, required entries)
- the **manifest schema** (`kdna.json` shape and required fields)
- the **payload profile schema** (e.g. `judgment-profile-v1`)
- the **encryption envelope metadata** (which entries are encrypted, key references)
- the **signature and digest metadata** (digest algorithm; signature metadata is reserved in v1 layout, OPTIONAL until 2027-Q1, REQUIRED after)
- the **version chain metadata** (lineage, judgment version, compatibility)
- the **runtime loading contract** (load profiles, decryption requirements, token hints)

KDNA Core is also the **toolchain reference**. The recommended way to produce, validate, load, and consume `.kdna` files is through the official KDNA toolchain.

## Authorization And Native Apps

Protected, licensed, remote, and native-app loading behavior is specified here:

- [Authorization contract](./specs/kdna-authorization-contract.md)
- [LoadPlan schema](./specs/kdna-loadplan.schema.json)
- [Runtime projection](./specs/kdna-runtime-projection.md)
- [Import security](./specs/kdna-import-security.md)
- [Apple native runtime integration](./docs/apple-native-runtime-integration.md)

## What KDNA Core does not define

KDNA Core is **content-neutral**. It does not define:

- **content quality** — what judgment is correct, complete, or high-value
- **author trust** — whether an author is credible or endorsed
- **official recommendations** — which assets should be used in production
- **distribution** — how third parties host, list, recommend, or sell assets
- **runtime policy** — what a loader should do with an asset at runtime (block, allow, warn)
- **content governance** — moderation, takedown, ranking, certification

These are concerns of **external** platforms and policies. KDNA Core supplies the verifiable primitives and the official toolchain (as a reference implementation); everything else is out of scope.

The recommended integration path is through the official SDK, CLI, Loader, or API. Third-party compatible implementations that pass the official validator are equally valid.

## Official KDNA toolchain

The official KDNA toolchain is published from this repo and its companion packages. The KDNA Core format and the official toolchain are versioned together; deviations between the spec and the official implementation are bugs.

| Component | Role | Source |
| --- | --- | --- |
| **KDNA Core spec** | Format, schemas, runtime loading contract | this repo |
| **KDNA CLI** | Official command-line entry: `inspect`, `validate`, `pack`, `unpack`, `load` | this repo + `@aikdna/kdna-cli` |
| **KDNA Loader** | Official runtime loader for AI agents | `packages/kdna-core/` + `@aikdna/kdna-cli` |
| **KDNA SDK** | Embeddable library for integrations | `packages/kdna-core/` |

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
│   ├── core/             # Phase 1: format baseline docs
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

This repository follows [SemVer 2.0](https://semver.org/) for the KDNA Core specification. The current target is `kdna_version: "1.0"` (Phase 1 baseline). Breaking changes to the manifest schema or payload profile require a major version bump and an RFC.

## Ecosystem

| Repo | Package | Purpose |
|------|---------|---------|
| [kdna-cli](https://github.com/aikdna/kdna-cli) | `@aikdna/kdna-cli` | KDNA Core v1 runtime CLI |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | `@aikdna/kdna-studio-cli` | AI-powered authoring CLI |
| [kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | `@aikdna/kdna-studio-core` | Studio SDK for creators |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | — | AI agent skill loader |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | — | Public asset releases |

## License

Apache 2.0. See [LICENSE](./LICENSE).
