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
  loadCapsuleV2,
  computeDigestEvidence,
  computeCapsuleDeliveryDigest,
  adaptCapsuleV2ToV1,
  pack,
  unpack,
  buildChecksums,
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
  as: 'json',
});

if (capsule.type !== 'kdna.context.capsule') {
  throw new Error('Expected a Runtime Capsule');
}
```

Capsule 2 is opt-in. It exposes A/C/E under distinct digest members while the
default Runtime API remains on the frozen Capsule 1 contract:

```js
const expectedA = {
  value: 'sha256:<64 lowercase hex>',
  source: 'install_receipt',
};

const evidence = computeDigestEvidence('./asset.kdna', {
  expectedDigests: {
    asset: expectedA,
  },
});

const capsule2 = loadCapsuleV2('./asset.kdna', {
  profile: 'compact',
  expectedDigests: {
    asset: expectedA,
  },
});

const deliveryDigest = computeCapsuleDeliveryDigest(capsule2);
const legacyCapsule = adaptCapsuleV2ToV1(capsule2);
```

An A, C, or E mismatch is returned as evidence by `computeDigestEvidence()`
and blocks `loadCapsuleV2()` with a digest-specific error. The adapter always
maps E to Capsule 1 `asset_digest`; it never substitutes A or C.
Internal manifest/checksum declarations are checked before independent
expected values, so a receipt match cannot conceal a bad declaration or
conflicting digest alias. The adapter also preserves the four frozen Capsule 1
inheritance/dependency/RAG extension fields through
`compatibility.capsule_1_extensions` without giving them Capsule 2 authority.

## Supported Runtime Flow

```text
.kdna file
→ validate
→ planLoad
→ loadAuthorized
→ Runtime Capsule
→ Agent/runtime context
```

The default compact Capsule preserves the asset's scoped judgment context:
`highest_question`, `worldview`, ordered `value_order`, `judgment_role`,
applicability-aware axioms, boundaries, self-checks, failure modes, and a
bounded pattern set. Core copies the three optional scoped fields without
trimming, reordering, or treating them as facts, policy, or quality evidence.

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

### Account/device external grants

RFC-0019 licensed assets can keep the encrypted container publicly available
while an issuer grants independent account/device access. `authorizeExternalKeyGrant()`
verifies the issuer signature, lease, revocation state, account, device, asset
UID/version/digest, and encrypted entry before returning a branded entitlement
and in-memory decrypt hook. A plain `{status: "active"}` object is not accepted.

Device private keys belong in the platform SecretStore. The returned session
must be disposed after loading; Agent-facing callers should receive only the
Runtime Capsule. Account grants never fall back to the password profile.

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
