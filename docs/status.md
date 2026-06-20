# KDNA Core Status — June 2026

> Current status page. For historical perspective, see [STATE_OF_KDNA.md](./STATE_OF_KDNA.md) (historical snapshot, dated 2026-06-09).

## Current positioning

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**.

`.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the **official KDNA toolchain**.

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

## What is beta

- **`kdna inspect`** — inspect local v1 `.kdna` containers, with dev source support for creator/debug workflows (available via `npm install -g @aikdna/kdna-cli@0.26.9`)
- **`kdna validate`** — validate local v1 `.kdna` containers, with dev source support for creator/debug workflows (schema + format + payload + checksums + load-contract)
- **`kdna plan-load`** — return the Core LoadPlan before runtime loading
- **`kdna load`** — render allowed public local `.kdna` assets into agent-readable context
- **`kdna pack`** — deterministic ZIP pack (mimetype first, STORED; same input → same SHA-256, verified as `3f0ba461...`)
- **`kdna unpack`** — unpack `.kdna` container, refuse path traversal
- **CLI v1 route tests and smoke checks** — pass for inspect, validate, LoadPlan, load refusal, pack, unpack, and source/container edge cases
- **Public beta narrative** — READMEs, website, and current public docs describe local packaged `.kdna` files, release cards, and beta boundaries. This is a propagation boundary, not a claim that the full ecosystem is stable.

**Resolved in 0.26.x**: the global CLI gap (previously the v1 route was only available from the monorepo). `npm install -g @aikdna/kdna-cli@0.26.9` now includes the full v1 inspect/validate/plan-load/pack/unpack/load route for public local assets.

## What is experimental

- **kdna install** / registry install — legacy compatibility path; the public registry is not part of KDNA Core v1
- **kdna compare** — comparison requires a provider key; not yet documented in the v1 guide
- **kdna setup** — agent setup (codex, claude-code, opencode, cursor); skills/MCP now use the v1 local asset loading path, while setup UX remains a post-baseline hardening surface
- **kdna-studio** — v1 authoring/export is published through `@aikdna/kdna-studio-cli@0.5.8` and `@aikdna/kdna-studio-core@1.5.7`; public propagation should center on packaged `.kdna` examples, not source JSON directories, registry entries, or a fixed three-domain primary narrative.
- **kdna-vscode** — VS Code extension (legacy workspace tools); not yet updated for v1 Core
- **Work Pack** — experimental workflow packaging; not v1 Core mainline

## What is legacy

- **Registry surface** — removed from the active public path; KDNA Core v1 has no registry
- **Quality-badge system** — legacy (untested / tested / validated / expert_reviewed / production_ready); not part of v1 Core
- **Human Lock** — optional Studio provenance/trust metadata; not part of v1 Core format validity
- **KDNAChat / KDNAStudio** — legacy product names; not active v1 Core surfaces
- **KDNA Viewer** — legacy concept, deleted from docs/

## Recommended first-run path

```bash
npm install -g @aikdna/kdna-cli@0.26.9
kdna --help
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna inspect /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

Creator/debug source workflows remain available, but they are not the public
asset consumption model:

```bash
kdna dev scaffold my_domain
kdna dev pack my_domain --out /tmp/out.kdna
kdna validate /tmp/out.kdna
kdna plan-load /tmp/out.kdna
kdna unpack /tmp/out.kdna /tmp/out-dir
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

1. **Global CLI v1 route — resolved in @aikdna/kdna-cli@0.26.9**. ✓
2. **Core extraction — published**: the compatibility package now routes v1 through shared `@aikdna/kdna-core/v1`; duplicate `packages/kdna/src/v1-cli.js` has been removed. Published in `@aikdna/kdna@0.9.0` with `@aikdna/kdna-core@^0.11.1`.
3. **Legacy CLI surfaces**: compatibility commands remain behind `kdna help legacy`; public first-run docs use local `.kdna` files with `validate`, `plan-load`, and `load`.
4. **Out-of-scope launch claims**: protected assets, remote runtime, paid authorization, public registry, marketplace distribution, and quality ranking are not part of the current stable baseline.
5. **Cross-implementation parity**: JS Core is the public first-run path. Swift remains beta until parity is proven against fixed Core v1 fixtures.
6. **Release evidence**: npm packages are published and installable; stronger provenance, SBOM, and attestation chains remain post-baseline release hardening.

## Next phase

KDNA v1 Official Pipeline Closure.

Priority: keep public local `.kdna` creation, validation, LoadPlan planning, and loading coherent across CLI, Studio CLI, Core, MCP, website, and docs. Encryption/signature, registry, remote runtime, paid authorization, and marketplace flows remain gated.
