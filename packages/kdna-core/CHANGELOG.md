# Changelog

## v0.13.3 (2026-06-22)
- Fix: index profile includes max_tokens_hint
- Fix: compact profile falls back to full_statement for TBD placeholders

# Changelog

Packages: `@aikdna/kdna-core`

## v0.13.2 (2026-06-21)

### Fixed
- Compact boundary projection now correctly preserves `applies_when`, `does_not_apply_when`, and `failure_risk` fields across all load profiles. These axiom governance fields are required by `kdna-loader` for domain routing decisions and were being dropped in compact mode under certain manifest configurations.
- Cross-platform test stability: Node test glob patterns are now compatible with both macOS and Linux filesystem sort orders.
- Hash library compatibility: `@noble/hashes` replaces Node-only crypto for digest operations, maintaining Node 18 compatibility without native module binding requirements.

### Changed
- Public API boundary hardened: `loadKDNA`, `loadKDNASync`, `inspectKDNA`, and `inspectKDNASync` now enforce the asset-first contract — callers must pass `.kdna` files or asset handles, not raw directory paths.
- Examples in README and inline docs reference the packaged `.kdna` path rather than source directories.
- First-run contract tightened: exported symbols, error codes, and validation gate names are now part of the stable API surface.

---

## v0.13.1 (2026-06-21)

### Fixed
- **Compact boundary projection preserved.** The `planLoad` function and `loadAuthorized` shim now pass through the full axiom governance projection (applies_when, does_not_apply_when, failure_risk) even when the load contract is not present in the manifest. Prior versions could strip these fields under compact profile, breaking domain routing for `kdna-loader`.
- Digest matching now tolerates `sha256:` prefix in both `manifest_digest` and `payload_digest` checksums entries. Previously, a leading `sha256:` prefix was treated as part of the hex digest, causing false mismatches.

### Changed
- Public API provenance and profile split clarified: `loadKDNA` / `loadKDNASync` are the stable entry points for runtime consumers. Lower-level `readV1Layout`, `runValidate`, and `planLoad` are exported for advanced tooling but carry no backward-compatibility guarantee.
- Access enum values normalized everywhere: `public`, `licensed`, `remote`. Legacy aliases (`open` → `public`, `protected` → `licensed`, `runtime` → `remote`) are mapped transparently with an info-level issue in the LoadPlan.
- `verifyAsset` / `verifyAssetSync`, `verifyDigest` / `verifyDigestSync`, and `verifySignature` / `verifySignatureSync` are now documented as the stable verification API surface.

---

## v0.13.0 (2026-06-19)

### Added
- **Authorization LoadPlan contract.** The `planLoad(inputPath, opts)` function returns a structured LoadPlan before any judgment content is decrypted or emitted. The LoadPlan reports:
  - `asset_id`, `asset_uid`, `title`, `version`, `judgment_version`
  - `access` model (`public` | `licensed` | `remote`)
  - `entitlement_profile` (`password`, `local_receipt`, `account`, `org`, `purchase_receipt`, `device_bound`)
  - `state` (`ready` | `needs_password` | `needs_license` | `needs_account` | `needs_org_auth` | `expired_grace` | `offline_grace` | `denied` | `invalid` | `needs_runtime`)
  - `required_action` (`load` | `enter_password` | `install_receipt` | `sign_in_or_activate` | `renew_entitlement` | `sync` | `contact_issuer` | `connect_runtime` | `block`)
  - `can_load_now` boolean — the single decision point for product consumers
  - `projection_policy` (`none` | `minimal` | `remote`)
  - `checks` block with per-gate validation results
  - `issues` array with structured error codes (`KDNA_FORMAT_INVALID`, `KDNA_INTEGRITY_DIGEST_FAILED`, `KDNA_AUTH_PASSWORD_REQUIRED`, `KDNA_AUTH_ENTITLEMENT_REQUIRED`, `KDNA_ACCESS_MODE_UNKNOWN`, etc.)
  - `input_fingerprint` capturing the source digest, has-password signal, and entitlement status for cache keying
  - `source.kind` and `source.path` indicating whether the input was a source directory or `.kdna` container
- **`loadAuthorized(inputPath, opts)`** — a higher-level loader that calls `planLoad` first and blocks load when `can_load_now` is false. Throws `KDNA_LOAD_NOT_AUTHORIZED` with the first issue's code. This is the recommended entry point for agent runtimes.
- **`loadV1(inputPath, opts)`** — renders judgment content into agent-ready prompt text. Supports profiles (`index`, `compact`, `scenario`, `full`) and output formats (`json`, `prompt`). The `prompt` format produces a flat text block suitable for agent context windows with proper axiom applicability rendering.
- **KDNA Core v1 inspect module.** `inspect(inputPath)` returns a content-neutral manifest summary including `asset_id`, `asset_uid`, `kdna_version`, `payload_encrypted`, `profile`, `load_contract_default_profile`, and signature count. Output is always JSON. Banned terms (`trusted`, `recommended`, `high_quality`, `officially_approved`) are enforced by an automatic assertion.
- **KDNA Core v1 validate module.** `validate(inputPath)` runs four independent gates:
  1. **Format gate:** required entries present (`mimetype`, `kdna.json`, `payload.kdnab`), mimetype content correct, lineage is an object not an array
  2. **Schema gate:** `kdna.json` against `manifest.schema.json` via AJV 2020-12
  3. **Payload gate:** `payload.kdnab` against `payload-profile-v1.schema.json`
  4. **Checksums gate:** when `checksums.json` is present, computed digests are compared against declared values for `kdna.json`, `payload.kdnab`, and the combined asset digest
- **KDNA Core v1 pack module.** `pack(sourceDir, outputPath)` produces a deterministic `.kdna` container: fixed DOS epoch timestamps, alphabetical entry order, mimetype first (STORED, method 0). Same source → byte-identical output.
- **KDNA Core v1 unpack module.** `unpack(inputPath, outputDir)` extracts a `.kdna` container to a directory with path-traversal protection.
- **Container security hardening.** ZIP reader enforces:
  - Maximum container size (25 MiB), max entries (128), max entry size (5 MiB), max total uncompressed (12 MiB)
  - Max compression ratio (100:1) to prevent zip bombs
  - Max JSON depth (64), max array length (10,000), max string length (1 MiB)
  - Entry name normalization (NFC Unicode, no backslash separators, no absolute paths, no `..` traversal)
  - Duplicate entry rejection
  - Symlink and device/special file rejection
- **Digest matching verification.** When `checksums.json` includes `manifest_digest`, `payload_digest`, or `asset_digest`, the validate module computes actual SHA-256 hashes and compares them. Mismatch produces a `KDNA_INTEGRITY_DIGEST_FAILED` issue.
- **Load contract validation.** When the manifest includes a `load_contract` block, it is validated against `load-contract.schema.json`. A missing load contract is not an error — it simply means no specialization.
- **Dual CJS/ESM exports.** `src/index.js` (CommonJS) and `src/index.mjs` (ES module) with matching `exports` map. The v1 module is also available at `@aikdna/kdna-core/v1`.
- **TypeScript declarations.** `src/types.d.ts` exports type definitions for the stable public API surface.

### Changed
- **V1 is the only active format path.** The v2 reader (`readDataMapSync`, `readDataMap`) remains in the codebase for migration compatibility but is no longer the default path. All new integrations should use the v1 API: `inspect`, `validate`, `planLoad`, `loadAuthorized`.
- `validate` and `planLoad` reject v2 containers (`application/vnd.aikdna.kdna+zip`) with a format error.
- Access model normalized to the three-tier `public` | `licensed` | `remote` enum. The LoadPlan maps legacy values transparently with an info-level issue.
- Container format detection (`detectContainerFormat`) reads only the first central-directory entry to determine v1 vs v2, preventing malicious later entries from causing format confusion.

### Removed
- Legacy v1 compatibility shims removed. v2 is the only legacy format and is handled through the existing `asset-reader.js` module.
- `readDataMapSync` / `readDataMap` deprecated for new use. Use `planLoad` + `loadV1` for runtime loading or `validate` + `inspect` for diagnostics.
