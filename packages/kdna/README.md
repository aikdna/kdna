# @aikdna/kdna

Compatibility package for the KDNA command line tools.

KDNA Core is the official KDNA judgment-asset format and runtime loading
contract. .kdna assets are created, inspected, packed, unpacked, and
validated through the official KDNA toolchain. Third-party products
integrate KDNA through the official SDK, CLI, Loader, or API.

This package is part of the official toolchain. The `bin/kdna.js` shim
is the v1-aware entry point of that toolchain; it dispatches packaged v1
`.kdna` containers to shared `@aikdna/kdna-core/v1`, and keeps compatibility
handling for older local working folders and legacy surfaces.

The compatibility install path is:

```bash
npm install -g @aikdna/kdna-cli
```

This package remains available so older installation instructions using
`@aikdna/kdna` resolve to the current KDNA CLI.

## KDNA Core v1 route

The `bin/kdna.js` shim in this package adds a KDNA Core v1 route on top of
the upstream `@aikdna/kdna-cli`. The public runtime path starts from a packaged
v1 `.kdna` container (ZIP with `mimetype` first, content
`application/vnd.kdna.asset`). Local working folders are accepted for
compatibility and packaging workflows, but they are not the public runtime
asset.

Usage:

```bash
kdna pack      examples/minimal /tmp/out.kdna
kdna validate  /tmp/out.kdna
kdna plan-load /tmp/out.kdna
kdna load      /tmp/out.kdna --profile=compact --as=prompt
```

The local invocation in this monorepo is:

```bash
node packages/kdna/bin/kdna.js <command> <args>
```

Or via the npm scripts in the repo root:

```bash
npm run kdna:pack     -- examples/minimal /tmp/out.kdna
npm run kdna:validate -- /tmp/out.kdna
```

The v1 route is content-neutral. Output never claims that an asset is
"trusted", "recommended", "high_quality", or "officially approved". It
reports format, schema, payload, checksums, and load-contract validity
only. Format-valid does not mean content-good; that is a runtime policy
decision owned by the caller.
