# KDNA CLI

> **Status: Phase 1 placeholder.** The CLI docs will be expanded in a later phase.

The KDNA CLI is the runtime control plane. It can `inspect`, `validate`, `pack`, and `unpack` `.kdna` files. Phase 1 introduces a minimal closed loop on the v1 format.

Implementation: [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli)

For the Phase 1 reference implementation that operates on the v1 format, see `scripts/` in this repo:

- `scripts/inspect-asset.mjs` — print manifest summary
- `scripts/validate-asset.mjs` — schema-validate manifest, payload, and checksums
- `scripts/pack-asset.mjs` — pack a source directory into a `.kdna` file
- `scripts/unpack-asset.mjs` — unpack a `.kdna` file into a directory
