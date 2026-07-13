# KDNA Core v1 Global CLI Baseline — June 2026 (Archived)

> **Archived release record.** This page describes a past CLI baseline. For
> current installation and command behavior, use the [CLI README](https://github.com/aikdna/kdna-cli#readme),
> [current status](../status.md), and GitHub Releases.

## What is new

- **@aikdna/kdna-cli@0.26.12** published to npm.
- **Global CLI v1 route**: `kdna inspect`, `kdna validate`, `kdna pack`, `kdna unpack` — available from `npm install -g @aikdna/kdna-cli`.
- **`kdna demo minimal <dir>`** — local first-run fixture for creating a packaged `.kdna` file from the terminal.
- **Deterministic pack** — same source packed twice produces byte-identical output (SHA-256 verified).
- **Content-neutral validation** — output reports format/schema/payload/checksums/load-contract status only. No trust / recommendation / quality-badge claims.
- **Official toolchain wording** — public docs, website, sub-repo READMEs, package metadata, and npm descriptions aligned with KDNA Core v1 sovereignty.
- **Public first-run surface** — starts with one local `.kdna` file, then validate, plan-load, and load.

## Try it now

```bash
npm install -g @aikdna/kdna-cli@0.26.12
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

All steps should pass from a clean environment with Node.js and npm.

## What is still beta

- Agent loader integration (kdna-loader skill)
- `kdna setup` / `kdna doctor` (legacy agent adapter)
- `kdna compare` (requires provider API key)
- Studio authoring path (kdna-studio-cli)
- Workpack format (experimental)
- Enterprise private asset flow

## What is legacy

The following are **not** part of KDNA Core v1 active path:

- Registry surface
- Quality-badge system (untested / tested / validated / expert_reviewed / production_ready)
- Marketplace / public registry framing
- private applications as named public product surfaces
- KDNA Viewer (deleted from docs)

## Current positioning

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**.

`.kdna` assets are created, inspected, protected, loaded, and consumed through the **official KDNA toolchain**.

Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral and does not evaluate content quality, recommend assets, operate a marketplace, or define a public registry.

## Docs

- Current status: [docs/status.md](../status.md)
- Tool status matrix: [docs/tool-status-matrix.md](../tool-status-matrix.md)
- 5-minute guide: [docs/try-kdna.md](../try-kdna.md)
