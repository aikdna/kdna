# KDNA Core Principles

The KDNA Core format rests on nine principles. Every feature in the spec, every schema field, and every CLI behaviour should trace back to one of these.

## 1. Content-neutral

KDNA Core is a format, not a content policy. The format can express any judgment system — sound or unsound, useful or harmful, expert or amateur. KDNA Core does not filter, rank, or recommend content. That work belongs to the caller and to external platforms.

KDNA Core is **content-neutral**, not **toolchain-neutral**. The format does not say what judgment is good. The format does say what is a properly formed `.kdna` file and how the official toolchain handles it.

## 2. Format authority

There is exactly one canonical schema for each KDNA Core artifact type (manifest, payload profile, checksums, load contract). The schemas in `schema/` are normative. The official KDNA toolchain validates against them. Deviations from the schemas are non-conformant, regardless of which party emits them.

## 3. Author-declared access

The author chooses `public`, `licensed`, or `remote`. Public assets do not claim
secrecy. Licensed assets protect the judgment payload through authorization and
in-memory decryption. Remote assets keep the full payload on deployer-controlled
infrastructure. KDNA Core enforces the declared access contract without
changing or judging the content.

## 4. Signature is not trust

A signature proves that a particular key signed a particular payload. It does not prove the signer is "good", "official", or "endorsed". KDNA Core records signatures as verifiable artifacts. Whether a signature is meaningful is a runtime policy decision, not a format property.

## 5. Version traceability

Every KDNA asset carries version metadata: `version` (release), `judgment_version` (semantic version of the encoded judgment), and a `lineage` object describing parent assets. The official KDNA loader can reconstruct the history of an asset without external services.

## 6. Runtime decides loading

KDNA Core defines **how and when** an asset is authorized to load. Consumers
must obey `can_load_now` and may apply additional caller-owned policy. A caller
may be stricter than the protocol, but may not bypass authorization, integrity,
or Runtime Capsule boundaries.

## 7. Distribution is external

KDNA Core does not include any registry, marketplace, store, or listing. Assets may be distributed by any means the producer chooses: file copy, HTTP, IPFS, email attachment, sneaker net. KDNA Core defines the file; distribution is somebody else's job.

## 8. Loader safety is mandatory

> **KDNA Core is content-neutral, but not loader-safety-neutral.**

KDNA Core 不判断内容好坏，但必须定义安全、可控、可追踪的加载行为。

A loader that ignores decryption errors, ignores signature mismatches, or silently truncates a payload is failing the format. The runtime load contract includes explicit status values (`failed_to_decrypt`, `signature_invalid`, `version_incompatible`, etc.) so that a loader cannot quietly "succeed" while producing garbage.

## 9. Toolchain-mediated interoperability

Anyone can create KDNA assets. The official SDK, CLI, Loader, and API are the
reference toolchain. A third-party Agent runtime is compatible when it
implements the full LoadPlan, authorization, integrity-verification, and
Runtime Capsule contracts. A raw ZIP/CBOR decoder is not a compatible runtime.

任何人都可以创建 KDNA。官方 SDK、CLI、Loader 和 API 是参考工具链。第三方 Agent 运行时只有完整实现 LoadPlan、授权、完整性校验和 Runtime Capsule 契约时才兼容；原始 ZIP/CBOR 解码器不是兼容运行时。

---

These nine principles are the contract. If a future feature conflicts with any of them, the feature is wrong.
