# KDNA

> **KDNA is an open judgment-asset file format for packaging, encrypting, versioning, and loading human-authored judgment systems into AI systems.**
>
> **KDNA 是一种开放的判断资产文件格式，用于把人类编写的判断体系封装、加密、版本化，并加载到 AI 系统中使用。**

> New to KDNA? → [Start Here](./docs/start-here.md)
>
> This repo defines the **KDNA Core** file format and runtime loading contract. Tools, content, and distribution are external.

[![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

## What is a KDNA file?

A `.kdna` file is a single, portable container that holds:

- a **public manifest** (`kdna.json`) — the asset's identity and metadata
- a **judgment payload** (`payload.kdnab`) — the actual structured judgment data
- optional **encryption envelope metadata** — to mark encrypted entries
- optional **signatures** — author / publisher attestations over the payload
- **version and lineage information** — for traceability across releases
- a **runtime load contract** — describes how loaders may read the asset
- optional **attachments** — supplementary files referenced from the payload
- an optional **checksums file** — per-entry digests for integrity checks

`.kdna` files are produced by authors using a tool (e.g. KDNA Studio) and consumed by AI runtimes (e.g. KDNA Loader, KDNA CLI) or viewers (e.g. KDNA Viewer). The format itself is content-neutral — KDNA Core does not say what judgment is "good" or which assets are "trusted".

## What KDNA Core defines

KDNA Core is the format authority. It defines:

- the **file format** (container layout, mimetype, required entries)
- the **manifest schema** (`kdna.json` shape and required fields)
- the **payload profile schema** (e.g. `judgment-profile-v1`)
- the **encryption envelope metadata** (which entries are encrypted, key references)
- the **signature and digest metadata** (signature references, digest algorithm)
- the **version chain metadata** (lineage, judgment version, compatibility)
- the **runtime loading contract** (load profiles, decryption requirements, token hints)

## What KDNA Core does not define

KDNA Core is **content-neutral**. It does not define:

- **content quality** — what judgment is correct, complete, or high-value
- **author trust** — whether an author is credible or endorsed
- **official recommendations** — which assets should be used in production
- **distribution** — registries, marketplaces, stores, public listings
- **runtime policy** — what a loader should do with an asset at runtime (block, allow, warn)
- **content governance** — moderation, takedown, ranking, certification

These are concerns of **external** platforms and policies. KDNA Core supplies the verifiable primitives; everything else is out of scope.

## Tools

The KDNA format is implemented by external, independent tools. Phase 1 only requires a minimal CLI closed loop on the v1 format.

| Tool | Role | Repo |
| --- | --- | --- |
| **KDNA Studio** | Authoring environment for human judgment | aikdna/kdna-studio-core |
| **KDNA CLI** | Runtime control plane: inspect, validate, pack, unpack, load | aikdna/kdna-cli |
| **KDNA Loader SDK** | Embeddable runtime loader for AI agents | aikdna/kdna-core |
| **KDNA Viewer** | Read-only inspection and rendering of `.kdna` files | (see [docs/tools/](./docs/tools/)) |

## Examples

See:

- [`examples/minimal/`](./examples/minimal/) — the smallest valid `.kdna` source layout
- [`samples/`](./samples/) — additional reference assets
- [`fixtures/`](./fixtures/) — conformance and test fixtures

## Repository layout

```
kdna/
├── packages/             # kdna-core (loader), kdna-eval (scoring harness)
├── schema/               # JSON Schemas for manifest, payload profile, checksums, ...
├── docs/                 # Spec, architecture, guides
│   ├── core/             # Phase 1: format baseline docs
│   ├── tools/            # Per-tool documentation
│   ├── examples/         # Example asset catalog
│   └── guides/           # How-to guides
├── examples/             # Reference `.kdna` source layouts
├── samples/              # Larger reference assets
├── fixtures/             # Conformance test fixtures
├── conformance/          # Conformance test runner
├── rfcs/                 # Accepted and proposed RFCs
└── specs/                # Normative specifications
```

## Versioning

This repository follows [SemVer 2.0](https://semver.org/) for the KDNA Core specification. The current target is `kdna_version: "1.0"` (Phase 1 baseline). Breaking changes to the manifest schema or payload profile require a major version bump and an RFC.

## License

Apache 2.0. See [LICENSE](./LICENSE).
