# ADR-003: Canonical Distribution Container

- **Status**: superseded by the current single-container specification
- **Date**: 2026-06-25
- **Deciders**: KDNA Core team

> **Historical decision record.** This ADR captures the consolidation work that
> removed the former multi-format implementation. It is not current format
> guidance. There is one user-facing KDNA Asset Container. See
> [SPEC.md](../../SPEC.md), [file-format.md](../core/file-format.md), and
> [version-taxonomy.md](../version-taxonomy.md).

## Context

The KDNA ecosystem currently has three incompatible container/manifest formats:

| Format | Used by | spec_version | Structure |
|---|---|---|---|
| Source-tree ZIP | `run.mjs` conformance | `"1.0-rc"` | `KDNA_Core.json` + `KDNA_Patterns.json` as ZIP entries |
| Directory-based | `authorization/` fixtures | `"1.0"` | `payload.kdnab` loose file + `checksums.json` |
| SPEC 2.0 canonical | SPEC.md | `"2.0"` | `payload.kdnab` + `signature.kdsig` + canonical manifest |

Additionally, there is a v1/v2 mimetype split:
- Container v1: `application/vnd.kdna.asset` (used by `kdna load`)
- Container v2: `application/vnd.aikdna.kdna+zip` (produced by `kdna protect`)

This split means `kdna protect` output cannot be loaded by `kdna load`.

## Decision

1. **There is ONE canonical distribution container format.** Writers (Studio, `kdna protect`, `kdna demo`, and all future exporters) SHALL only produce this format.

2. **The canonical container** follows the SPEC 2.0 structure:
   ```
   mimetype
   kdna.json      (canonical manifest)
   payload.kdnab   (CBOR-encoded judgment payload)
   signature.kdsig (Ed25519 signature)
   ```

3. **Legacy Container v1 is read-only compatibility.** Readers SHALL support both Legacy Container v1 and Canonical Distribution Container. Both formats SHALL be converted to the same internal `CanonicalAssetModel` before processing.

4. **No new capabilities for legacy containers.** Legacy Container v1 SHALL NOT receive encryption, signing, or new format features. An explicit migration command (`kdna migrate`) or re-export path SHALL be provided.

5. **Do NOT add more v1/v2 special-casing.** Instead, build a unified container dispatcher + normalization layer (B1 in the execution roadmap).

6. **All documentation MUST use qualified names:**
   - `KDNA Core v1` (product version)
   - `Container v1` (mimetype/format)
   - `Judgment Profile v1` (payload schema)
   - `Studio legacy export` (historical migration context)
   
   Bare, unqualified `v1` or `v2` is FORBIDDEN.

## Consequences

- `kdna protect` must stop producing Container v2 and switch to canonical container.
- A unified container dispatcher (B1) is the dependency root for all encryption/authorization BUILD work.
- The source-tree ZIP format tested by `run.mjs` is explicitly deprecated for distribution.
- Conformance tests must be rewritten to use the canonical container format.
- Migration tooling must be provided for existing Container v1 assets.
