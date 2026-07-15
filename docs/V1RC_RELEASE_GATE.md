# KDNA 1.0-rc Release Gate

> ⚠️ **Historical snapshot.** This obsolete release gate does not describe the
> current KDNA Core or the single KDNA Asset Container. Current docs:
> README.md, docs/core/definition.md, and docs/core/principles.md.

This release gate applies to the open protocol and tooling only. Applications
and already-published assets follow the protocol after the tools are released.

## Release Order

1. Merge and tag `aikdna/kdna`.
2. Publish `@aikdna/kdna-core@0.7.2`.
3. In `aikdna/kdna-cli`, refresh dependencies against published
   `@aikdna/kdna-core@^0.7.2`; only then bump the CLI package metadata.
4. Publish `@aikdna/kdna-cli`.
5. ~~Merge `aikdna/kdna-registry` metadata/tooling validation updates.~~ (Historical — registry out of scope for KDNA Core v1)6. ~~Repack and resign registry assets with the new CLI.~~ (Historical)
7. ~~Run `npm run validate:remote` in `kdna-registry` after assets are republished.~~ (Historical — registry out of scope for KDNA Core v1)

## Required Checks

Protocol repository:

```bash
npm run release:preflight
```

CLI repository:

```bash
npm run release:preflight
```

Registry repository:

```bash
npm run release:preflight
```

Remote registry validation is intentionally after asset republishing:

```bash
npm run validate:remote
```

## Dependency Sequencing

Do not commit a CLI `package-lock.json` that resolves
`@aikdna/kdna-core` against a version that doesn't exist on npm. Keep the CLI
repository installable with the latest published core package until the core
release is complete, then run:

```bash
npm install @aikdna/kdna-core@^0.7.2 --package-lock-only
npm version <version> --no-git-tag-version
npm run release:preflight
```

## Non-Negotiable 1.0 Rules

- Manifest uses `kdna_version: "1.0"`.
- `format`, `format_version`, and `spec_version` are not protocol discriminators.
- `kdna_spec` is invalid.
- Singular `language` is invalid.
- Root `mimetype` is required and must be
  `application/vnd.kdna.asset`.
- `application/x-kdna` is invalid.
- Signatures use the 1.0 canonical content-tree payload only.
- Registry installable entries must declare `media_type`,
  `asset_url`, and `asset_digest`.
