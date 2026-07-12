# @aikdna/kdna-core

Core library for `.kdna` judgment assets. It implements the single KDNA Asset
Container, strict-CBOR payload decoding, validation, LoadPlan authorization,
and Runtime Capsule projection used by the CLI, Studio, skills, MCP
integrations, and downstream Agent runtimes.

## Installation

```bash
npm install @aikdna/kdna-core
```

If you need full JSON Schema validation through Ajv, also install:

```bash
npm install ajv ajv-formats
```

## Public API

Use the package root. Version-qualified entrypoints and API names are not part
of the public contract.

```js
const {
  inspect,
  validate,
  planLoad,
  loadAuthorized,
  pack,
  unpack,
  buildChecksums
} = require('@aikdna/kdna-core');

const validation = validate('./asset.kdna');
if (!validation.overall_valid) {
  throw new Error(validation.problems.join('\n'));
}

const plan = planLoad('./asset.kdna');
if (plan.can_load_now !== true) {
  throw new Error(`Asset is not loadable yet: ${plan.required_action}`);
}

const capsule = loadAuthorized('./asset.kdna', {
  profile: 'compact',
  as: 'json'
});

if (capsule.type !== 'kdna.context.capsule') {
  throw new Error('Expected a Runtime Capsule');
}
```

## Supported Runtime Flow

```text
.kdna file
→ validate
→ planLoad
→ loadAuthorized
→ Runtime Capsule
→ Agent/runtime context
```

For authoring and test fixtures, `pack()` can turn a local working folder into
a `.kdna` file before validation:

```text
local working folder
→ pack
→ .kdna file
→ validate
→ planLoad
→ loadAuthorized
```

## KDNA Asset Container

A `.kdna` asset contains:

- `mimetype`
- `kdna.json`
- `payload.kdnab`
- `checksums.json`

`validate()` checks:

- format
- manifest schema
- payload parseability
- checksum consistency
- load-profile contract

`payload.kdnab` is CBOR. A password-protected or licensed asset stores a CBOR
encryption envelope in the same entry; authorized plaintext is decrypted in
memory and projected into the Runtime Capsule.

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

KDNA Core is content-neutral. It validates file structure and loadability;
it does not rank judgment quality or endorse specific assets.

## License

Apache-2.0
