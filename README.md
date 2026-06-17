# KDNA

> **KDNA Core is the official KDNA judgment-asset format and runtime loading contract.**
>
> **KDNA Core 是 KDNA 官方判断资产格式与运行时加载契约。**

> `.kdna` assets are created, inspected, protected, loaded, and consumed through the **official KDNA toolchain**. Third parties integrate through the official SDK, CLI, Loader, or API — they do not implement KDNA independently.
>
> `.kdna` 资产通过 **KDNA 官方工具链** 创建、检查、保护、加载和消费。第三方产品通过 KDNA 官方 SDK、CLI、Loader 或 API 接入 KDNA,而不独立实现。

> New to KDNA? → [Start Here](./docs/start-here.md)
>
> This repo defines **KDNA Core** — the file format, schemas, and runtime loading contract. The official KDNA toolchain is published from this repo and its companion packages.

[![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli) [![CI](https://github.com/aikdna/kdna/actions/workflows/validate.yml/badge.svg)](https://github.com/aikdna/kdna/actions/workflows/validate.yml) [![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

## What is a KDNA file?

A `.kdna` file is a single, portable container that holds:

- a **public manifest** (`kdna.json`) — the asset's identity and metadata
- a **judgment payload** (`payload.kdnab`) — the actual structured judgment data
- optional **encryption envelope metadata** — to mark encrypted entries
- optional **signatures** — author / publisher attestations over the payload
- **version and lineage information** — for traceability across releases
- a **runtime load contract** — describes how the official KDNA loader may read the asset
- optional **attachments** — supplementary files referenced from the payload
- an optional **checksums file** — per-entry digests for integrity checks

`.kdna` files are produced by authors through the official KDNA toolchain and consumed by the official KDNA loader. The format itself is content-neutral — KDNA Core does not say what judgment is "good" or which assets are "trusted".

## What KDNA Core defines

KDNA Core is the **format authority**. It defines:

- the **file format** (container layout, mimetype, required entries)
- the **manifest schema** (`kdna.json` shape and required fields)
- the **payload profile schema** (e.g. `judgment-profile-v1`)
- the **encryption envelope metadata** (which entries are encrypted, key references)
- the **signature and digest metadata** (signature references, digest algorithm)
- the **version chain metadata** (lineage, judgment version, compatibility)
- the **runtime loading contract** (load profiles, decryption requirements, token hints)

KDNA Core is also the **toolchain authority**. Production, validation, loading, and consumption of `.kdna` files happen through the official KDNA toolchain. The format is documented publicly so that every `.kdna` file is verifiable; the toolchain is canonical so that the verification is meaningful.

## What KDNA Core does not define

KDNA Core is **content-neutral**. It does not define:

- **content quality** — what judgment is correct, complete, or high-value
- **author trust** — whether an author is credible or endorsed
- **official recommendations** — which assets should be used in production
- **distribution** — registries, marketplaces, stores, public listings
- **runtime policy** — what a loader should do with an asset at runtime (block, allow, warn)
- **content governance** — moderation, takedown, ranking, certification

These are concerns of **external** platforms and policies. KDNA Core supplies the verifiable primitives and the official toolchain; everything else is out of scope.

KDNA Core also does not invite **independent re-implementation**. The format is public so files are verifiable; the toolchain is canonical so verification is meaningful. Third parties integrate through the official SDK, CLI, Loader, or API.

## Official KDNA toolchain

The official KDNA toolchain is published from this repo and its companion packages. The KDNA Core format and the official toolchain are versioned together; deviations between the spec and the official implementation are bugs.

| Component | Role | Source |
| --- | --- | --- |
| **KDNA Core spec** | Format, schemas, runtime loading contract | this repo |
| **KDNA CLI** | Official command-line entry: `inspect`, `validate`, `pack`, `unpack`, `load` | this repo + `@aikdna/kdna-cli` |
| **KDNA Loader** | Official runtime loader for AI agents | `packages/kdna-core/` + `@aikdna/kdna-cli` |
| **KDNA SDK** | Embeddable library for first-party integrations | `packages/kdna-core/` |

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API. They do not implement the KDNA file format independently.

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
