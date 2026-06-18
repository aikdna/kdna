# KDNA Core Status — June 2026

> Current status page. For historical perspective, see [STATE_OF_KDNA.md](./STATE_OF_KDNA.md) (historical snapshot, dated 2026-06-09).

## Current positioning

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**.

`.kdna` assets are created, inspected, protected, loaded, and consumed through the **official KDNA toolchain**.

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral. It does not evaluate content quality, recommend assets, operate a marketplace, or define a public registry.

## What is stable now

- **`.kdna` file format** — container layout, mimetype, required entries
- **Manifest schema** (`schema/manifest.schema.json`) — `kdna.json` shape
- **Payload profile schema** (`schema/payload-profile-v1.schema.json`)
- **Load contract** — `index` / `compact` / `scenario` / `full` profiles
- **Checksums** — per-entry SHA-256 / SHA-512 / BLAKE2b-256
- **Runtime trace vocabulary** (`docs/core/trace.md`)
- **Content-neutral output boundary** — `trusted` / `recommended` / `high_quality` / `officially_approved` / `quality_badge` never emitted
- **Public narrative** — READMEs, docs/core/, website P0 pages, cross-repo audit

## What is beta

- **`kdna inspect`** — inspect v1 source dir or v1 `.kdna` container (available via `npm install -g @aikdna/kdna-cli@0.25.0`)
- **`kdna validate`** — validate v1 source dir or v1 `.kdna` container (schema + format + payload + checksums + load-contract)
- **`kdna pack`** — deterministic ZIP pack (mimetype first, STORED; same input → same SHA-256, verified as `3f0ba461...`)
- **`kdna unpack`** — unpack `.kdna` container, refuse path traversal
- **32 CLI tests** — all pass (inspect, validate, pack, unpack, edge cases)

**Resolved in 0.25.0**: the global CLI gap (previously the v1 route was only available from the monorepo). `npm install -g @aikdna/kdna-cli@0.25.0` now includes the full v1 inspect/validate/pack/unpack route.

## What is experimental

- **kdna install** / registry install — legacy path via `kdna-registry`; registry is a legacy experiment, marked as not active KDNA Core v1 path
- **kdna compare** — comparison requires a provider key; not yet documented in the v1 guide
- **kdna setup** — agent setup (codex, claude-code, opencode, cursor); works but the `kdna-loader` skill is the legacy skill adapter, not yet updated for v1
- **kdna-studio** — authoring CLI (legacy Studio-compatible pipeline); not yet updated for v1 Core
- **kdna-vscode** — VS Code extension (legacy workspace tools); not yet updated for v1 Core
- **Work Pack** — experimental workflow packaging; not v1 Core mainline

## What is legacy

- **kdna-registry** — marked as legacy experiment (kdna-registry README banner); KDNA Core v1 has no registry
- **Quality-badge system** — legacy (untested / tested / validated / expert_reviewed / production_ready); not part of v1 Core
- **Human Lock** — legacy authoring concept; not part of v1 Core format
- **KDNAChat / KDNAStudio** — legacy product names; not active v1 Core surfaces
- **KDNA Viewer** — legacy concept, deleted from docs/

## Recommended first-run path

```bash
npm install -g @aikdna/kdna-cli@0.25.0
kdna --help
kdna inspect examples/minimal
kdna validate examples/minimal
kdna pack examples/minimal /tmp/out.kdna
kdna unpack /tmp/out.kdna /tmp/out-dir
kdna validate /tmp/out-dir
```

For developers who want to contribute from source:

```bash
git clone https://github.com/aikdna/kdna.git
cd kdna
npm ci
npm test
```

For the legacy 5-minute walkthrough (old CLI surface), see [5-minute-guide.md](./5-minute-guide.md).

## Known limitations

1. **Global CLI v1 route — resolved in @aikdna/kdna-cli@0.25.0**. ✓
2. **Core extraction pending**: the v1 format logic lives in `packages/kdna/src/v1-cli.js` (707 lines) and `aikdna/kdna-cli/src/v1-cli.js` (duplicated). Both should be merged into `@aikdna/kdna-core` (PR-99 in the Sovereignty Baseline plan).
3. **6 skipped tests**: kdna-core fixture tests skipped in PR-95 (v1→v2 fixture migration debt). Marked for recovery in PR-100.
4. **Conformance failure**: `kdna.json.format_version: "1.0"` vs expected `"2.0"` in the conformance runner. Same fixture debt.
5. **kdnACLI help text**: the legacy global CLI help still references `dev validate` / `dev pack` / `dev unpack` (non-canonical dev source utilities), not the v1 route.
6. **npm descriptions**: resolved in v0.22.x / v0.3.3 / v1.5.2 — all "trusted .kdna" references removed. ✓

## Next phase

KDNA Core Sovereignty Baseline → KDNA Toolchain Usability & First-Run Proof.

Priority: merge P1 sub-repo PRs → publish v1-aware CLI → Core extraction → conformance recovery → encryption/signature.
