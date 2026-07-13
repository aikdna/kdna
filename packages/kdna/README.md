# @aikdna/kdna

Compatibility package for the KDNA command line tools.

KDNA Core is the official KDNA judgment-asset format and runtime loading
contract. `.kdna` assets are created, inspected, packed, validated, planned,
and loaded through the KDNA toolchain. Compatible Agent consumption ends in a
Runtime Capsule; it does not decode container internals directly.

This package only preserves older executable names. New integrations should
depend on `@aikdna/kdna-core` and install `@aikdna/kdna-cli` directly. KDNA has
one current Asset Container and the compatibility package does not introduce a
second format or runtime route.

`kdna-validate` is a compatibility alias for `kdna validate` and accepts both
current packaged `.kdna` assets and authoring source directories. It delegates
to `@aikdna/kdna-cli`; it does not use the removed source-only validator.

The compatibility install path is:

```bash
npm install -g @aikdna/kdna-cli
```

This package remains available so older installation instructions using
`@aikdna/kdna` resolve to the current KDNA CLI.

## Current runtime path

The public runtime path starts from a packaged `.kdna` asset and delegates to
the current CLI/Core contract.

Usage:

```bash
kdna pack      examples/minimal /tmp/out.kdna
kdna validate  /tmp/out.kdna
kdna plan-load /tmp/out.kdna
kdna load      /tmp/out.kdna --profile=compact --as=json
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

The runtime is content-neutral. Output never claims that an asset is
"trusted", "recommended", "high_quality", or "officially approved". It
reports format, schema, payload, checksums, and load-contract validity
only. Format-valid does not mean content-good; that is a runtime policy
decision owned by the caller.
