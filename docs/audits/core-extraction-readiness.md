# Core Extraction Readiness — June 2026

## Purpose

KDNA Core v1 logic currently exists in two locations. Before encryption,
signature, conformance, or Studio/Loader integration proceed, the v1 format
logic should be consolidated into one **official shared core** so that
CLI / Studio / Loader / SDK do not drift.

This is NOT a reference implementation — it is the **official KDNA
toolchain core**. Third-party products integrate KDNA through the official
SDK / CLI / Loader / API, not through independent reimplementation.

## Target

Package: `@aikdna/kdna-core` (the existing npm package)

The `kdna-core` package already exports format-level functions
(`inspectKDNA`, `validateKDNA`, `loadKDNA`, etc.) for the legacy v2
container format. The v1 logic would be added as a parallel v1 module
(`src/v1/`) within the same package.

## Duplicate implementation map

| Function | monorepo (packages/kdna/src/v1-cli.js) | kdna-cli (src/v1-cli.js) | Status | Extraction target |
|---|---|---|---|---|
| isV1SourceDir | ✓ | ✓ | Identical logic | `@aikdna/kdna-core` src/v1/ |
| detectContainerFormat | ✓ (returns 'v1'/'v2'/null) | ✓ | Identical | same |
| listZipEntries (read) | ✓ | ✓ | Identical | same |
| buildZip (write/pack) | ✓ | ✓ | Identical | same |
| crc32 table | ✓ | ✓ | Duplicated | same |
| inspect | ✓ | ✓ | Identical output format | same |
| validate | ✓ | ✓ | Identical (structural + schema via ajv) | same |
| pack (deterministic) | ✓ | ✓ | Identical (ZIP epoch timestamps, mimetype first) | same |
| unpack | ✓ | ✓ | Identical (path traversal guard) | same |
| schema loading | ✓ (walks up from __dirname) | ✓ (walks up from __dirname) | Same logic, different schema roots | same, resolve schemas from package root |
| FORBIDDEN_OUTPUT_TERMS | ✓ | ✓ | Identical | same |
| readV1Layout | ✓ | ✓ | Identical | same |
| loadSchemas (ajv) | ✓ (optional, degrades gracefully) | ✓ (optional) | Identical | same |

## Key differences to reconcile

| Area | monorepo | kdna-cli | Resolution |
|---|---|---|---|
| Schema root | walks repo root (for `schema/`) | walks package root (for `schema/`) | `@aikdna/kdna-core` should embed schema files and resolve from its own `schema/` directory |
| CLI entry | `packages/kdna/bin/kdna.js` (shim) | `src/cli.js` (main) | CLI stays in kdna-cli; calls core functions |
| Test fixtures | `examples/minimal/` | `fixtures/v1-minimal/` | Core should ship with a canonical fixture |

## Extraction principles

1. **Official shared core, not reference implementation.**
   CLI, Studio, Loader call the same `@aikdna/kdna-core`.
2. **Third-party integration, not reimplementation.**
   Third parties call the official SDK / CLI / Loader / API.
3. **Same output for same input.**
   `kdna pack` from CLI and `kdna-core.pack()` produce byte-identical output.
4. **Content-neutral boundary preserved.**
   The core enforces the forbidden-output-terms boundary.
5. **Deterministic pack is a core property, not a CLI feature.**
   The ZIP writer belongs in core.

## What stays in CLI

After extraction, `aikdna/kdna-cli/src/cli.js` would:
- Parse command-line arguments
- Route to v1 core functions (inspect/validate/pack/unpack)
- Handle stdout/stderr formatting and JSON output
- Route to legacy commands (dev, install, etc.)

The `src/v1-cli.js` in both repos would be deleted (or become a thin wrapper).

## Next steps

1. Publish `@aikdna/kdna-core` with the v1 module and embedded `schema/`.
2. Update `aikdna/kdna-cli` to depend on the new core version and drop
   `src/v1-cli.js`.
3. Update `aikdna/kdna` packages to depend on the new core version and
   drop `packages/kdna/src/v1-cli.js`.
4. Update `aikdna/kdna-website` docs-content.js to reflect the new
   source.
5. Verify deterministic pack produces the same SHA-256 from both CLI
   and core.
6. Update `kdna-studio-core` and `kdna-studio-cli` to call core
   pack/validate.
