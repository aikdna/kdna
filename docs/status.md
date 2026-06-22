# KDNA Core Status — June 2026

> Current status page. For historical perspective, see [STATE_OF_KDNA.md](./STATE_OF_KDNA.md) (historical snapshot, dated 2026-06-09).

## Current positioning

KDNA v1 Core GA is released. It is the **official KDNA judgment-asset format and runtime loading contract**.

`.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the **official KDNA toolchain**.

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral. It validates file structure, integrity, and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.

## What is stable (v1 Core GA)

- **`.kdna` file format** — container layout, mimetype, required entries
- **Manifest schema** (`schema/manifest.schema.json`) — `kdna.json` shape
- **Payload profile schema** (`schema/payload-profile-v1.schema.json`)
- **Load contract** — `index` / `compact` / `scenario` / `full` profiles
- **Checksums** — per-entry SHA-256 / SHA-512 / BLAKE2b-256
- **Content-neutral output boundary** — Core validation does not emit recommendation, endorsement, or quality-ranking claims
- **`kdna inspect`** — inspect local v1 `.kdna` containers (available via `npm install -g @aikdna/kdna-cli@0.27.6`)
- **`kdna validate`** — validate local v1 `.kdna` containers (schema + format + payload + checksums + load-contract)
- **`kdna plan-load`** — return the Core LoadPlan before runtime loading, with structured `input_fingerprint` and entitlement state diagnostics
- **`kdna load`** — render v1 `.kdna` assets into agent-readable context (`--profile=index|compact|scenario|full`, `--as=json|prompt`)
- **`kdna pack`** — deterministic ZIP pack (mimetype first, STORED; same input → same SHA-256)
- **`kdna unpack`** — unpack `.kdna` container, refuse path traversal
- **`kdna demo minimal`** — create a minimal v1 fixture for first-run testing
- **CLI tests** — 30 tests pass for inspect, validate, LoadPlan, load, pack, unpack, and contract shape
- **Studio CLI** — v1 authoring/export published through `@aikdna/kdna-studio-cli@0.6.5` and `@aikdna/kdna-studio-core@1.5.12`

All stable commands are available in the public v1 Core CLI surface. `kdna --help` shows the complete v1 Core command surface.

## Recommended first-run path

```bash
npm install -g @aikdna/kdna-cli@0.27.6
kdna --help
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

Studio authoring path:

```bash
npm install -g @aikdna/kdna-studio-cli@0.6.5
kdna-studio create ./school --name @test/school --author "Your Name"
kdna-studio card add ./school axiom --field one_sentence="..." [all 8 required fields]
kdna-studio card approve ./school --all --by me --statement "I confirm."
kdna-studio export ./school --format v1 --out ./school.kdna
kdna validate ./school.kdna
```

## Removed in v1 Core 0.27.0

The following legacy v0.7 command surfaces were removed in the hard cutover to v1 Core GA (`@aikdna/kdna-cli@0.27.0`):

- `kdna help legacy`
- `kdna setup`
- `kdna install`
- `kdna remove / update / info`
- `kdna list / search`
- `kdna registry`
- `kdna verify`
- `kdna compare / diff`
- `kdna doctor / trace / history`
- `kdna publish`
- `kdna identity`
- `kdna license`
- `kdna protect / unlock / recover`
- `kdna workpack`
- `kdna cluster`
- `kdna governance / proposal / review / evolution / regression`
- `kdna dev`
- All legacy subcommands (badge, test, changelog, etc.)

These were removed from the v1 Core CLI. Future systems such as distribution, signing, encryption, entitlement, remote runtime, diagnostics, and workpacks may return only through new RFCs and separate packages. They are not part of the current v1 Core GA release.

## What is experimental / in development

- **kdna-studio** — v1 authoring/export is stable (0.6.5); advanced AI authoring features (distill, interview, feynman) are experimental
- **kdna-vscode** — VS Code extension (legacy workspace tools); not yet updated for v1 Core
- **kdna-loader** — agent adapter skill; functional for supported agents, UX hardening deferred
- **kdna-core-swift** — Swift runtime; beta until parity proven against fixed Core v1 conformance fixtures
- **kdna-lab** — pressure-test infrastructure; experimental

## Deferred (future RFCs)

- Registry / asset discovery / distribution
- Signing / encryption / protected assets (RFC-0009)
- Entitlement / commercial authorization
- Remote runtime / hosted loading
- Work Pack assembly and cluster composition
- Quality badges and content ranking

## Known limitations

1. **v2 / legacy registry containers** — old registry-distributed v2 `.kdna` assets are not supported by the v1 Core CLI. Users with legacy assets must re-export through current Studio v1 tooling. The CLI emits a clear "Unsupported legacy/registry container" error for v2 inputs.
2. **Cross-implementation parity** — JS Core is the public first-run path. Swift remains beta until parity is proven.
3. **Release evidence** — npm packages are published and installable; stronger provenance, SBOM, and attestation chains remain post-baseline release hardening.
4. **Real judgment demo** — the `kdna demo minimal` fixture proves format validity but does not demonstrate judgment value. A real-judgment demo asset is planned for the next work package (#18).
