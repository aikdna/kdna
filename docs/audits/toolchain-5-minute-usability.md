# KDNA Toolchain 5-Minute Usability — June 2026

Date: 2026-06-17
Status: CONDITIONAL PASS (kdnACLI install works; v1 route requires monorepo)

## Environment

- macOS, Node.js v22
- Global `kdna` at `/opt/homebrew/bin/kdna` → @aikdna/kdna-cli v0.21.1
- Local monorepo at `/Users/AI/K/OPEN/kdna`

## Command-by-command

### 1. npm install -g @aikdna/kdna-cli

```
$ npm install -g @aikdna/kdna-cli
```
Already installed (v0.21.1). ✓

### 2. kdna --help

```
$ kdna --help
kdna v0.21.1 — The runtime control plane for domain judgment

Usage: kdna <command> [options]

Dev Source Utilities (non-canonical):
  init <name>                      Deprecated alias for dev scaffold
  dev scaffold <name>              Scaffold a non-canonical dev source workspace
  dev validate <path>              Validate a dev source directory
  dev pack <path>                  Build a dev-only non-trusted .kdna bundle
  dev unpack <file>                Unpack .kdna into a dev source directory
  dev inspect <path>               Inspect a dev source directory
```
FAIL: help text is the OLD upstream help. Does NOT show v1 `inspect` /
`validate` / `pack` / `unpack` commands.

### 3. kdna setup

Not run. This is a legacy agent setup command. The v1 Core doesn't define
agent integration yet.

### 4. kdna doctor --agents

Not run. Legacy CLI surface.

### 5. kdna list

Not run. Legacy CLI surface.

### 6. kdna install @aikdna/writing

Not run. This depends on the legacy `kdna-registry`, which is marked as a
legacy experiment. KDNA Core v1 has no registry.

### 7. kdna inspect examples/minimal (global CLI)

```
$ kdna inspect examples/minimal
Error: Directory inspection is a dev-only operation.
Use: kdna dev inspect <source-dir>
```
FAIL: global CLI does not support v1 inspection.

### 8. kdna inspect examples/minimal (local shim)

```
$ node packages/kdna/bin/kdna.js inspect examples/minimal
{
  "kdna_version": "1.0",
  "asset_id": "kdna:example:atomspeak-core",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Atomspeak Core",
  ...
}
```
PASS: v1 shim works. Content-neutral output.

### 9. kdna validate / pack / unpack / validate (local shim)

All pass. See `docs/audits/core-v1-cli-usability.md` for full output.

### 10. kdna compare @aikdna/writing --input "help me improve this post"

Not run. Requires provider API key. Not documented in v1 guide.

## Summary

| Command | Global CLI | Local shim | Notes |
|---|---|---|---|
| kdna --help | FAIL: old text | PASS | v1 commands not shown in global help |
| kdna inspect | FAIL: "dev-only" | PASS | Global CLI rejects directory input |
| kdna validate | FAIL: "dev-only" | PASS | Same |
| kdna pack | FAIL (not available) | PASS: deterministic | Same |
| kdna unpack | FAIL (not available) | PASS | Same |
| kdna setup | not tested (legacy) | not tested | Legacy surface |
| kdna doctor | not tested (legacy) | not tested | Legacy surface |
| kdna install | not tested (needs registry) | not tested | Registry is legacy |
| kdna compare | not tested (needs API key) | not tested | Provider key required |

## Critical finding

The 5-minute guide commands (`install`, `verify`, `compare`) are all legacy
CLI surface. They depend on the legacy kdna-registry, legacy agent setup, and
provider API keys.

A v1-native 5-minute path would be: clone repo → `npm ci` →
`node packages/kdna/bin/kdna.js inspect examples/minimal` → see JSON output →
`node packages/kdna/bin/kdna.js pack examples/minimal /tmp/out.kdna` →
`shasum -a 256` to verify determinism.

This path works TODAY but requires the monorepo clone. It does NOT work from
`npm install -g`.

## Recommendation

1. **Publish v1-aware shim to npm** so that `npm install -g @aikdna/kdna`
   gives the v1 route.
2. **Rewrite 5-minute guide** for v1 Core: drop `kdna install / kdna compare`
   and replace with `kdna inspect / validate / pack / unpack`.
3. **Keep legacy 5-minute guide** as a historical reference (`docs/5-minute-guide.md`),
   not as the main getting-started path.
