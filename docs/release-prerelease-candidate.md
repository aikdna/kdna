# Prerelease candidate release preflight

Added 2026-10-05 under the Owner ruling "fix the repository release path" and the joint
design review (`check-release-prerelease-readiness`). This is the repository's own
preflight for **prerelease candidates**; it complements — and does not modify or
replace — the stable release path (`check-release-readiness.js`,
`core-release-authority.js`).

## Relationship to the stable path

- Stable releases keep their existing rules: stable semver only, GitHub Release event,
  non-draft/non-prerelease, tag/ref/commit binding, clean worktree.
- This preflight is separate by design and imports none of that machinery: it runs
  fully local and offline. The two channels are mutually exclusive: this script
  rejects any member version without `-`, and the stable path continues to reject
  prerelease versions.
- `prepublishOnly` ("publish only through scripts/core-release-authority.js and its
  retained artifact") and the direct-worktree-publication ban are unchanged. Tarball
  publication (`npm publish <tgz>`) does not invoke `prepublishOnly`, so there is no
  conflict with this preflight.

## Frozen hard requirements (joint design review, 2026-10-05)

1. The naming step is **mandatory**: a missing `--naming-bind` or a non-zero naming
   exit is an **overall failure**. The naming step is never skipped.
2. Scope sentence — 命名门槛覆盖**源坐标**（经 live 仓原样检查），**非 tarball 字节**。
   ("The naming gate covers source coordinates (checked as-is via the live repository),
   not tarball bytes.") It is emitted in every report.

## Usage

```bash
node scripts/check-release-prerelease-readiness.mjs \
  --package=packages/kdna-read --label=read \
  --candidate=<candidate.json> --naming-bind=<source-coordinate-string> \
  [--dist-tag=<tag>] [--out=<report.json>] [--sandbox=<dir>]
```

Package hooks (append runtime inputs after `--`):

```bash
npm run release:check:prerelease --workspace @aikdna/kdna-core -- --candidate=<file> --naming-bind=<coord>
npm run release:check:prerelease --workspace @aikdna/kdna-read -- --candidate=<file> --naming-bind=<coord>
```

## Candidate file (`kdna.prerelease-candidate/1`)

```json
{
  "format": "kdna.prerelease-candidate/1",
  "dist_tag": "r2.7",
  "members": [
    { "name": "@aikdna/kdna-core", "version": "0.36.0-rc.r2.7", "tgz": "<path>", "sha256": "<hex>", "member_count": 427 },
    { "name": "@aikdna/kdna-read", "version": "0.11.0-rc.r2.7", "tgz": "<path>", "sha256": "<hex>", "member_count": 90 }
  ],
  "closure": [ { "name": "ajv", "version": "8.20.0", "tgz": "<path>", "sha256": "<hex>" } ],
  "peer_pins": [ { "package": "@aikdna/kdna-read", "peer": "@aikdna/kdna-core", "version": "0.36.0-rc.r2.7" } ]
}
```

## What it checks

1. **Channel policy**: prerelease only; `dist_tag` required, never `latest`, and never
   semver-shaped.
2. **Candidate identity**: tarball SHA-256 recomputed and compared; tarball package.json
   name/version match; no `file:`/`link:`/`workspace:` or absolute dependency
   specifiers; source/packed members.
3. **Content**: member allowlist count; forbidden members (`.env`, `.git`,
   `node_modules`, key material); LICENSE presence (a `LICENSE` file or a recognized
   `license` field; a `NOTICE` alone does not satisfy it).
4. **Peer pins**: exact equality between declared pin, the holder's package.json, and
   the sibling member version.
5. **Naming gate** (mandatory): runs `scripts/check-post-cutover-naming.mjs` as-is via
   the live repository; non-zero exit fails the whole preflight. The report records the
   raw naming stdout, the runtime git HEAD and porcelain counts, and the naming
   script SHA-256.
6. **Functional smoke**: offline closure install of the members and their closure
   (`file:` graph, `npm_config_offline=true`), then byte-compares each installed
   `package.json` against the tarball's copy and loads every member.

## Exit codes

`0` all checks passed; `1` overall failure (the first failing check code is recorded;
this includes an explicitly empty `--naming-bind` → `NAMING_BIND_MISSING`); `64` usage
error (an absent required argument — including an absent `--naming-bind` — or an
unknown flag).
