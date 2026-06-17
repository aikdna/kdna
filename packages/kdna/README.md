# @aikdna/kdna

Compatibility package for the KDNA command line tools.

The canonical package is:

```bash
npm install -g @aikdna/kdna-cli
```

This package remains available so older installation instructions using
`@aikdna/kdna` resolve to the current KDNA CLI.

## KDNA Core v1 route

The `bin/kdna.js` shim in this package adds a KDNA Core v1 route on top of
the upstream `@aikdna/kdna-cli`. When the input is a v1 source directory
(`mimetype` + `kdna.json` + `payload.kdnab`) or a v1 `.kdna` container
(ZIP with `mimetype` first, content `application/vnd.kdna.asset`), the
shim dispatches to a local v1 implementation in `src/v1-cli.js`. Anything
else falls through to the upstream CLI unchanged.

Usage:

```bash
# v1 source directory
kdna inspect  examples/minimal
kdna validate examples/minimal
kdna pack     examples/minimal /tmp/out.kdna
kdna unpack   /tmp/out.kdna /tmp/out-unpacked
```

The local invocation in this monorepo is:

```bash
node packages/kdna/bin/kdna.js <command> <args>
```

Or via the npm scripts in the repo root:

```bash
npm run kdna:inspect  -- examples/minimal
npm run kdna:validate -- examples/minimal
npm run kdna:pack     -- examples/minimal /tmp/out.kdna
npm run kdna:unpack   -- /tmp/out.kdna /tmp/out-unpacked
```

The v1 route is content-neutral. Output never claims that an asset is
"trusted", "recommended", "high_quality", or "officially approved". It
reports format, schema, payload, checksums, and load-contract validity
only.
