# KDNA Core Principles

The KDNA Core format rests on eight principles. Every feature in the spec, every schema field, and every CLI behaviour should trace back to one of these.

## 1. Content-neutral

KDNA Core is a format, not a content policy. The format can express any judgment system — sound or unsound, useful or harmful, expert or amateur. KDNA Core does not filter, rank, or recommend content. That work belongs to the caller and to external platforms.

## 2. Format authority

There is exactly one canonical schema for each KDNA Core artifact type (manifest, payload profile, checksums, load contract). The schemas in `schema/` are normative. Tools MUST validate against them; deviations are bugs.

## 3. Private assets first

KDNA Core supports encrypted entries from day one. A `.kdna` file can have parts that are readable (manifest, optionally plaintext sections) and parts that are encrypted (sensitive judgment content, licensed material). The format is designed so that privacy is the default, not an afterthought.

## 4. Signature is not trust

A signature proves that a particular key signed a particular payload. It does not prove the signer is "good", "official", or "endorsed". KDNA Core records signatures as verifiable artifacts. Whether a signature is meaningful is a runtime policy decision, not a format property.

## 5. Version traceability

Every KDNA asset carries version metadata: `version` (release), `judgment_version` (semantic version of the encoded judgment), and a `lineage` array (parent assets). Loaders and viewers can reconstruct the history of an asset without external services.

## 6. Runtime decides loading

KDNA Core defines **how** a loader may read an asset. It does not define **whether** a loader should read it, or what to do with the result. Blocklists, allowlists, content warnings, and runtime policies are caller concerns.

## 7. Distribution is external

KDNA Core does not include any registry, marketplace, store, or listing. Assets may be distributed by any means the producer chooses: file copy, HTTP, IPFS, email attachment, sneaker net. KDNA Core is the file; distribution is somebody else's job.

## 8. Loader safety is mandatory

> **KDNA Core is content-neutral, but not loader-safety-neutral.**

KDNA Core 不判断内容好坏，但必须定义安全、可控、可追踪的加载行为。

A loader that ignores decryption errors, ignores signature mismatches, or silently truncates a payload is failing the format. The runtime load contract includes explicit status values (`failed_to_decrypt`, `signature_invalid`, `version_incompatible`, etc.) so that a loader cannot quietly "succeed" while producing garbage.

---

These eight principles are the contract. If a future feature conflicts with any of them, the feature is wrong.
