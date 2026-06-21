# @aikdna/kdna-core

Core library for local `.kdna` judgment assets.

KDNA Core v1 defines the `.kdna` file format, schemas, secure container
reader, LoadPlan contract, and runtime projection helpers used by the CLI,
Studio export, skills, MCP integrations, and downstream agent runtimes.

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
  planLoad,
  loadAuthorized,
  pack,
  unpack,
  buildChecksumsV1
} = require('@aikdna/kdna-core/v1');

const validation = validate('./asset.kdna');
if (!validation.overall_valid) {
  throw new Error(validation.problems.join('\n'));
}

const plan = planLoad('./asset.kdna');
if (plan.can_load_now !== true) {
  throw new Error(`Asset is not loadable yet: ${plan.required_action}`);
}

const compact = loadAuthorized('./asset.kdna', {
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
→ planLoad
→ loadAuthorized
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

`loadAuthorized()` supports:

- `index`
- `compact`
- `scenario`
- `full`

Output formats:

- `json`
- `prompt`

## Boundary

KDNA Core v1 is content-neutral. It validates file structure and loadability;
it does not rank judgment quality or endorse specific assets.

## Legacy API

The package root still exports compatibility APIs for older KDNA paths. New
tooling should prefer `@aikdna/kdna-core/v1` and the `planLoad` /
`loadAuthorized` path.

## License

Apache-2.0
