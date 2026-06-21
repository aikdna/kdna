# KDNA Core Status — June 2026

> Current status page. For historical perspective, see [STATE_OF_KDNA.md](./STATE_OF_KDNA.md) (historical snapshot, dated 2026-06-09).

## Current positioning

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**.

`.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the **official KDNA toolchain**.

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral. It validates file structure, integrity, and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.

## What is stable now

- **`.kdna` file format** — container layout, mimetype, required entries
- **Manifest schema** (`schema/manifest.schema.json`) — `kdna.json` shape
- **Payload profile schema** (`schema/payload-profile-v1.schema.json`)
- **Load contract** — `index` / `compact` / `scenario` / `full` profiles
- **Checksums** — per-entry SHA-256 / SHA-512 / BLAKE2b-256
- **Runtime trace vocabulary** (`docs/core/trace.md`)
- **Content-neutral output boundary** — Core validation does not emit recommendation, endorsement, or quality-ranking claims

## What is beta

- **`kdna inspect`** — inspect local v1 `.kdna` containers, with dev source support for creator/debug workflows (available via `npm install -g @aikdna/kdna-cli@0.26.12`)
- **`kdna validate`** — validate local v1 `.kdna` containers, with dev source support for creator/debug workflows (schema + format + payload + checksums + load-contract)
- **`kdna plan-load`** — return the Core LoadPlan before runtime loading
- **`kdna load`** — render allowed public local `.kdna` assets into agent-readable context
- **`kdna pack`** — deterministic ZIP pack (mimetype first, STORED; same input → same SHA-256, verified as `3f0ba461...`)
- **`kdna unpack`** — unpack `.kdna` container, refuse path traversal
- **CLI v1 route tests and smoke checks** — pass for inspect, validate, LoadPlan, load refusal, pack, unpack, and source/container edge cases
- **Public beta narrative** — READMEs, website, and current public docs describe local packaged `.kdna` files, release cards, and beta boundaries. This is a propagation boundary, not a claim that the full ecosystem is stable.

**Resolved in 0.26.x**: the global CLI gap (previously the v1 route was only available from the monorepo). `npm install -g @aikdna/kdna-cli@0.26.12` now includes the full v1 inspect/validate/plan-load/pack/unpack/load route for public local assets.

## What is experimental

- **kdna install** — legacy compatibility path; not part of the local packaged `.kdna` first-run route
- **kdna compare** — comparison requires a provider key; not yet documented in the v1 guide
- **kdna setup** — agent setup (codex, claude-code, opencode, cursor); skills/MCP now use the v1 local asset loading path, while setup UX remains a post-baseline hardening surface
- **kdna-studio** — v1 authoring/export is published through `@aikdna/kdna-studio-cli@0.5.11` and `@aikdna/kdna-studio-core@1.5.8`; public propagation should center on packaged `.kdna` examples with release-card evidence.
- **kdna-vscode** — VS Code extension (legacy workspace tools); not yet updated for v1 Core
- **Work Pack** — experimental workflow packaging; not v1 Core mainline

## What is legacy

- **Hosted discovery surface** — not part of the active Core v1 public beta path
- **Legacy content labels** — old ranking labels are not part of v1 Core
- **Human Lock** — optional Studio provenance/trust metadata; not part of v1 Core format validity
- **Legacy app names** — not active v1 Core surfaces
- **KDNA Viewer** — legacy concept, deleted from docs/

## Recommended first-run path

```bash
npm install -g @aikdna/kdna-cli@0.26.12
kdna --help
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna inspect /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

Advanced creator/debug source workflows remain available for contributors and
tool authors. Public consumption should start from packaged `.kdna` files and
the `validate` → `plan-load` → `load` path above.

For developers who want to contribute from source:

```bash
git clone https://github.com/aikdna/kdna.git
cd kdna
npm ci
npm test
```

For the compact first-run walkthrough, see [5-minute-guide.md](./5-minute-guide.md).

## Known limitations

1. **Global CLI v1 route — resolved in @aikdna/kdna-cli@0.26.12**. ✓
2. **Core extraction — published**: the compatibility package now routes v1 through shared `@aikdna/kdna-core/v1`; duplicate `packages/kdna/src/v1-cli.js` has been removed. Current public beta package line is `@aikdna/kdna@0.10.3` with `@aikdna/kdna-core@0.12.5`.
3. **Legacy CLI surfaces**: compatibility commands remain behind `kdna help legacy`; public first-run docs use local `.kdna` files with `validate`, `plan-load`, and `load`.
4. **Out-of-scope launch claims**: protected assets, remote runtime, paid authorization, hosted distribution, commercial asset distribution, and quality ranking are not part of the current stable baseline.
5. **Cross-implementation parity**: JS Core is the public first-run path. Swift remains beta until parity is proven against fixed Core v1 fixtures.
6. **Release evidence**: npm packages are published and installable; stronger provenance, SBOM, and attestation chains remain post-baseline release hardening.

## Next phase

KDNA v1 Official Pipeline Closure.

Priority: keep public local `.kdna` creation, validation, LoadPlan planning, and loading coherent across CLI, Studio CLI, Core, MCP, website, and docs. Encryption/signature, remote runtime, paid authorization, and hosted distribution flows remain gated.
