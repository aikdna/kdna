# KDNA v1.0-rc Release Gate

This release gate applies to the open protocol and tooling only. Applications
and already-published assets follow the protocol after the tools are released.

## Release Order

1. Merge and tag `aikdna/kdna`.
2. Publish `@aikdna/kdna-core@0.6.0`.
3. In `aikdna/kdna-cli`, refresh dependencies against published
   `@aikdna/kdna-core@0.6.0`; only then bump the CLI package metadata to
   `0.19.0`.
4. Publish `@aikdna/kdna-cli@0.19.0`.
5. Merge `aikdna/kdna-registry` metadata/tooling validation updates.
6. Repack and resign registry assets with the new CLI.
7. Run `npm run validate:remote` in `kdna-registry` after assets are republished.

## Required Checks

Protocol repository:

```bash
npm test
npm run conformance
npm run lint
git diff --check
```

CLI repository:

```bash
npm run lint
npm run test:all
git diff --check
```

Registry repository:

```bash
npm test
git diff --check
```

Remote registry validation is intentionally after asset republishing:

```bash
npm run validate:remote
```

## Dependency Sequencing

Do not commit a CLI `package-lock.json` that resolves
`@aikdna/kdna-core@0.6.0` before that package exists on npm. Keep the CLI
repository installable with the latest published core package until the core
release is complete, then run:

```bash
npm install @aikdna/kdna-core@^0.6.0 --package-lock-only
npm version 0.19.0 --no-git-tag-version
npm ci
npm run lint
npm run format:check
npm run test:all
```

## Non-Negotiable v1.0 Rules

- Manifest uses `format`, `format_version`, and `spec_version`.
- `kdna_spec` is invalid.
- Singular `language` is invalid.
- Root `mimetype` is required and must be
  `application/vnd.aikdna.kdna+zip`.
- `application/x-kdna` is invalid.
- Signatures use the v1.0 canonical content-tree payload only.
- Registry installable entries must declare `media_type`,
  `asset_url`, and `asset_digest`.
