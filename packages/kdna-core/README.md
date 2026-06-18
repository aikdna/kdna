# @aikdna/kdna-core

Core library for KDNA judgment assets.

KDNA Core v1 defines the official `.kdna` source/container contract used by
the CLI, Studio export, skills, MCP integrations, and downstream agent
runtimes.

## Installation

```bash
npm install @aikdna/kdna-core
```

If you need full JSON Schema validation through Ajv, also install:

```bash
npm install ajv ajv-formats
```

## KDNA Core v1 API

Use the `./v1` entrypoint for current KDNA Core v1 tooling:

```js
const {
  inspect,
  validate,
  pack,
  unpack,
  loadV1,
  buildChecksumsV1
} = require('@aikdna/kdna-core/v1');

const validation = validate('./asset.kdna');
if (!validation.overall_valid) {
  throw new Error(validation.problems.join('\n'));
}

const compact = loadV1('./asset.kdna', {
  profile: 'compact',
  as: 'prompt'
});
```

## Supported Runtime Flow

```text
v1 source directory
→ buildChecksumsV1
→ pack
→ validate
→ loadV1
→ agent/runtime context
```

## v1 Source Directory

A v1 source directory contains:

- `mimetype`
- `kdna.json`
- `payload.kdnab`
- `checksums.json`

## v1 Container

A v1 `.kdna` container is a zip package of the same files. `validate()` checks:

- format
- manifest schema
- payload parseability
- checksum consistency
- load-profile contract

## Load Profiles

`loadV1()` supports:

- `index`
- `compact`
- `scenario`
- `full`

Output formats:

- `json`
- `prompt`

## Boundary

KDNA Core v1 is content-neutral. It does not recommend assets, assign quality
badges, run a marketplace, or define a public registry. Future signature,
encryption, licensing, and entitlement work is gated outside the current v1
baseline.

## Legacy API

The package root still exports compatibility APIs for older KDNA paths. New
tooling should prefer `@aikdna/kdna-core/v1`.

## License

Apache-2.0
