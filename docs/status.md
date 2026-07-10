# KDNA Core Status — July 2026

> Current status page. For historical perspective, see [STATE_OF_KDNA.md](../STATE_OF_KDNA.md) (historical snapshot, dated 2026-06-09).
> **Version naming**: See [version-taxonomy.md](./version-taxonomy.md). "Core baseline" refers to the KDNA Core 2026.06 Baseline, not legacy formats.

## Current positioning

KDNA Core is a public beta implementation of the **KDNA judgment-asset format
and runtime loading contract**.

`.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the **official KDNA toolchain**.

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral. It validates file structure, integrity, and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.

## Current public baseline

- **`.kdna` file format** — container layout, mimetype, required entries
- **Manifest schema** (`schema/manifest.schema.json`) — `kdna.json` shape
- **Payload profile schema** (`schema/payload-profile-v1.schema.json`)
- **Load contract** — `index` / `compact` / `scenario` / `full` profiles
- **Checksums** — per-entry SHA-256 / SHA-512 / BLAKE2b-256
- **Content-neutral output boundary** — Core validation does not emit recommendation, endorsement, or quality-ranking claims
- **`kdna inspect`** — inspect local v1 `.kdna` containers (available via `npm install -g @aikdna/kdna-cli@0.29.0`)
- **`kdna validate`** — validate local v1 `.kdna` containers (schema + format + payload + checksums + load-contract)
- **`kdna plan-load`** — return the Core LoadPlan before runtime loading, with structured `input_fingerprint` and entitlement state diagnostics
- **`kdna load`** — render v1 `.kdna` assets into agent-readable context (`--profile=index|compact|scenario|full`, `--as=json|prompt`)
- **`kdna pack`** — deterministic ZIP pack (mimetype first, STORED; same input → same SHA-256)
- **`kdna unpack`** — unpack `.kdna` container, refuse path traversal
- **`kdna demo minimal`** — create a minimal v1 fixture for first-run testing
- **Consumption runtime** — `kdna route`, `kdna compose`, and `kdna project`
  provide traced selection, bounded composition, and packaged-asset projection
- **Consumption evaluation** — `kdna eval-consumption` and the review commands
  support public-safe fixture replay, budget reporting, and disabled candidate
  sidecar output
- **CLI verification** — released commands are covered by the CLI test suite;
  consult the package release notes for version-specific test evidence
- **Studio CLI** — stable authoring/export published through `@aikdna/kdna-studio-cli@0.8.12` and `@aikdna/kdna-studio-core@1.7.10`

The public CLI surface is discoverable through `kdna --help`. Compatibility and
maturity may vary by command; use the tool status matrix and release notes for
version-specific detail.

## Recommended first-run path

```bash
npm install -g @aikdna/kdna-cli@0.29.0
kdna --help
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

For task-aware selection and evaluation, see the
[Consumption Runtime guide](./consumption-runtime.md).

Studio authoring path:

```bash
npm install -g @aikdna/kdna-studio-cli@0.8.12
kdna-studio create ./school --name @test/school --author "Your Name"
kdna-studio card add ./school axiom --field one_sentence="..." [all 8 required fields]
kdna-studio card approve ./school --all --by me --statement "I confirm."
kdna-studio export ./school --format v1 --out ./school.kdna
kdna validate ./school.kdna
```

## Experimental or evolving surfaces

- **kdna-studio** — stable authoring/export is stable (0.8.12); advanced AI authoring features (distill, interview, feynman) are experimental
- **kdna-vscode** — VS Code extension — archived as of 2026-06-25; use kdna-cli for validate, plan-load, pack/unpack
- **kdna-loader** — official agent adapter skill; stable, supports OpenCode/Codex/Claude Code/Cursor/Gemini via `kdna setup`
- **kdna-core-swift** — Swift runtime; beta until parity proven against fixed Core v1 conformance fixtures

## Deferred (future RFCs)

- Registry / asset discovery / distribution
- Signing / encryption / protected assets (RFC-0009)
- Entitlement / commercial authorization
- Remote runtime / hosted loading
- Work Pack assembly
- Quality badges and content ranking

## Known limitations

1. **Legacy registry containers** — old registry-distributed `.kdna` assets are not supported by the Core baseline CLI. Users with legacy assets must re-export through the current Studio baseline tooling. The CLI emits a clear "Unsupported legacy/registry container" error for legacy inputs.
2. **Cross-implementation parity** — JS Core is the public first-run path. Swift remains beta until parity is proven.
3. **Release evidence** — npm packages are published and installable; stronger provenance, SBOM, and attestation chains remain post-baseline release hardening.
4. **Minimal demo scope** — `kdna demo minimal` proves format validity. Use a
   published asset and the Consumption Runtime guide when evaluating a
   task-aware integration.
