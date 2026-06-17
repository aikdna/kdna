# Package Entrypoint & Version Audit — June 2026

## npm packages

| Package | npm version | Local version | Description | Issue |
|---|---|---|---|---|
| @aikdna/kdna | 0.8.2 | 0.9.0 (package.json) | "KDNA toolkit compatibility package. Use @aikdna/kdna-cli for the canonical CLI." | npm is behind local version. Local description updated (P0 sweep), npm not republished. |
| @aikdna/kdna-cli | 0.21.1 | — (external) | "KDNA CLI — runtime control plane for verifying, installing, loading, comparing, publishing, and auditing existing .kdna assets." | v1 route NOT in npm version. Global kdna binary does not support v1 inspect/validate/pack/unpack. |
| @aikdna/kdna-core | 0.9.1 | 0.9.1 ✓ | "KDNA core library — load, validate, lint, and render KDNA domain judgment assets. Supports KDNA Container format." | OK. Version matches. |
| @aikdna/kdna-studio-core | 1.5.0 | — (external) | "Studio-compatible authoring kernel for Human Lock, compile, and export of trusted .kdna assets." | **FORBIDDEN**: "trusted .kdna" in description. Flag P1. |
| @aikdna/kdna-studio-cli | 0.3.2 | — (external) | "Official KDNA Studio command-line authoring entry for creating, locking, compiling, and exporting trusted .kdna assets." | **FORBIDDEN**: "trusted .kdna" in description. Flag P1. |

## Which package should a new user install?

| User goal | Right package | Right command |
|---|---|---|
| "I want to use KDNA" | `npm install -g @aikdna/kdna-cli` | `kdna` |
| "I want to develop with KDNA" | `npm install @aikdna/kdna-core` | `require('@aikdna/kdna-core')` |
| "I want to create KDNA domains" | `npm install -g @aikdna/kdna-studio-cli` | `kdna-studio` |
| "I want the v1 CLI route" | Clone monorepo | `node packages/kdna/bin/kdna.js` |

## Entry point confusion

The `@aikdna/kdna` package is a **compatibility package** that
re-exports `@aikdna/kdna-cli`. The v1-aware shim lives in
`packages/kdna/bin/kdna.js` in the monorepo but has NOT been
published to npm yet. This creates a split:

- npm `kdna` binary → old `@aikdna/kdna-cli` v0.21.1 → no v1 support
- monorepo `kdna` shim → `packages/kdna/bin/kdna.js` → full v1 support

The user should never have to choose between "the npm kdna" and
"the monorepo kdna". The v1-aware shim should be published so that
`npm install -g @aikdna/kdna` includes v1.

## Version drift

| Package | Local | npm | Drift |
|---|---|---|---|
| @aikdna/kdna | 0.9.0 | 0.8.2 | -0.0.8 (npm behind) |
| @aikdna/kdna-core | 0.9.1 | 0.9.1 | 0 (synced) |

## Recommendations

1. **Publish v1-aware kdna CLI**: republish `@aikdna/kdna` with the v1-aware
   shim (`packages/kdna/bin/kdna.js`).
2. **Undo npm description drift**: `@aikdna/kdna-studio-core` and
   `@aikdna/kdna-studio-cli` npm descriptions still say "trusted .kdna".
   Fix in the next release of each.
3. **Document the gap**: the current `docs/status.md` and `docs/start-here.md`
   already note the global CLI limitation. Keep these docs up to date until
   the publish gap is closed.
