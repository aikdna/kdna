# Core v1 CLI Usability — June 2026

Date: 2026-06-17
Status: PASS

## Commands executed

All commands run from the kdna monorepo root, using the local v1-aware shim
(`node packages/kdna/bin/kdna.js`), NOT the globally installed `kdna` (v0.21.1).

### inspect

```
$ node packages/kdna/bin/kdna.js inspect examples/minimal
{
  "kdna_version": "1.0",
  "asset_id": "kdna:example:atomspeak-core",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Atomspeak Core",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "payload": "payload.kdnab",
  "payload_encrypted": false,
  "profile": "judgment-profile-v1",
  "load_contract_default_profile": "compact"
}
```
PASS ✓ — output is content-neutral. No `trusted` / `recommended` / `high_quality` /
`officially_approved` / `quality_badge`.

### validate

```
$ node packages/kdna/bin/kdna.js validate examples/minimal
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```
PASS ✓ — all gates valid. No content-quality claims.

### pack (deterministic)

```
$ node packages/kdna/bin/kdna.js pack examples/minimal /tmp/a.kdna
Packed: /tmp/a.kdna
Entries: 4 (mimetype, checksums.json, kdna.json, payload.kdnab)

$ node packages/kdna/bin/kdna.js pack examples/minimal /tmp/b.kdna
Packed: /tmp/b.kdna
Entries: 4 (mimetype, checksums.json, kdna.json, payload.kdnab)

$ shasum -a 256 /tmp/a.kdna /tmp/b.kdna
3f0ba461a6d89170cd18404908358830357c811801e71146c640f65831bc7071  /tmp/a.kdna
3f0ba461a6d89170cd18404908358830357c811801e71146c640f65831bc7071  /tmp/b.kdna
```
PASS ✓ — deterministic. Same SHA-256 across two independent pack runs.

### unpack + re-validate

```
$ node packages/kdna/bin/kdna.js unpack /tmp/a.kdna /tmp/unpacked
Unpacked: /tmp/unpacked
Entries: 4 (mimetype, checksums.json, kdna.json, payload.kdnab)

$ node packages/kdna/bin/kdna.js validate /tmp/unpacked
{
  "overall_valid": true,
  "problems": []
}
```
PASS ✓ — unpacked directory is a valid v1 source dir.

### 32 CLI tests

```
$ npm run test:cli-v1
# tests 32
# pass 32
# fail 0
```
PASS ✓

## Critical gap: global CLI

The globally installed `kdna` binary (via `npm install -g @aikdna/kdna-cli`
v0.21.1) does **not** support the v1 commands. Running `kdna inspect
examples/minimal` returns: "Directory inspection is a dev-only operation.
Use: kdna dev inspect <source-dir>".

The v1 route only works from the monorepo via `node packages/kdna/bin/kdna.js`.
The v1-aware shim has NOT been published to npm. This is the single biggest
usability gap between the "KDNA Core v1 is done on paper" and "a new user can
actually use it from a global install."

Fix: publish a new `@aikdna/kdna` / `@aikdna/kdna-cli` version that includes
the v1 route shim, or release a separate v1 CLI entry.
