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
  loadRuntimeCapsule,
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

const capsule2 = loadRuntimeCapsule('./asset.kdna', {
  profile: 'compact',
  expectedDigests: {
    asset: expectedA,
  },
});

const deliveryDigest = computeCapsuleDeliveryDigest(capsule2);
const legacyCapsule = adaptCapsuleV2ToV1(capsule2);
```

ConsumptionPlan 1, Agent Host 2, and JudgmentTrace 1 are opt-in APIs in
`@aikdna/kdna-core@0.18.0`. Plan 1 accepts only Capsule 2 plus Host 2: it has no
downgrade or legacy adapter. The default Runtime path remains Capsule 1,
ConsumptionPlan 0.9, and Agent Host 1. The opt-in builders derive
protocol-owned members, while every verifier receives a non-null trusted Plan
digest and independently observed capabilities, request, receipt, and delivery
state as explicit context:

```js
const {
  parseRuntimeContractJson,
  buildConsumptionPlan,
  buildAgentHostRequest,
  buildPreHostBudgetBlockedTrace,
  validatePreHostBudgetBlockedTrace,
  validateAgentHostReceipt,
  buildJudgmentTrace,
} = require('@aikdna/kdna-core');

const plan = buildConsumptionPlan({
  plan_id: 'plan_0123456789abcdef',
  created_at: new Date().toISOString(),
  task,
  asset_ref,
  projection_profile: 'compact',
  budget,
  constraints: { enforce_before_host: true, reject_on_exceed: true },
  trace_policy: { emit: true, storage: 'session' },
});

const executionContext = {
  plan,
  trustedPlanDigest: plan.integrity.plan_digest,
  capabilities: observedHostCapabilities,
  coreCapsuleVersions: ['2.0', '1.0'],
};
const request = buildAgentHostRequest(
  { request_id: 'host_0123456789abcdef01234567', capsule: capsule2 },
  executionContext,
);

// Parse raw Host JSON before object-level Schema/correlation validation.
const receipt = parseRuntimeContractJson(rawReceiptBytes);
const receiptValidation = validateAgentHostReceipt(receipt, { request });
if (!receiptValidation.valid) throw new Error(receiptValidation.code);

const trace = buildJudgmentTrace(traceInput, {
  ...executionContext,
  request,
  receipt,
  trustedDeliveryObservation: 'host_receipt',
});
```

When no receipt exists, Trace construction requires the caller to state the
trusted observation explicitly as `not_delivered` or `not_observed`; request
existence alone is not treated as delivery evidence.

If Capsule projection succeeded but the exact projection or task character
count exceeds the Plan budget, `buildAgentHostRequest()` fails closed and
must not be bypassed. Use the dedicated evidence-only terminal instead:

```js
const blockedTrace = buildPreHostBudgetBlockedTrace(
  {
    trace_id: 'trace_0123456789abcdef',
    timestamp: new Date().toISOString(),
    capsule: capsule2,
  },
  executionContext,
);

const blockedValidation = validatePreHostBudgetBlockedTrace(blockedTrace, {
  ...executionContext,
  capsule: capsule2,
});
if (!blockedValidation.valid) throw new Error(blockedValidation.code);
```

This API returns only a `blocked` / `not_delivered` Trace with a fixed budget
error. It retains A/C/E, sender P, projection profile, exact character actuals,
and `exceeded` comparison, but it never exposes an over-budget Host request or
a request ID. Calling it when neither projection nor task is over budget is an
error.

`parseRuntimeContractJson()` is the raw protocol boundary. It rejects
duplicate decoded object keys, invalid UTF-8, BOMs, non-scalar Unicode,
non-finite numbers, trailing input, and non-RFC JSON grammar before an object
validator runs. Its default limits are 2 MiB and 64 nested containers;
`maxBytes` and `maxDepth` may only tighten those limits. Error
`code_unit_offset` details are UTF-16 code-unit indexes, not UTF-8 byte
offsets. Parsed object validators cannot reconstruct overwritten duplicate
keys, invalid original bytes, or a stripped BOM, so Host adapters must not use
plain `JSON.parse()` for untrusted protocol messages.

An A, C, or E mismatch is returned as evidence by `computeDigestEvidence()`
and blocks `loadRuntimeCapsule()` with a digest-specific error. The adapter always
maps E to Capsule 1 `asset_digest`; it never substitutes A or C. Core computes
E from the raw Runtime manifest and payload bytes even when `checksums.json` is
absent, in which case E is reported as `not_compared`.
Internal manifest/checksum declarations are checked before independent
expected values, so a receipt match cannot conceal a bad declaration or
conflicting digest alias. The adapter also preserves the four frozen Capsule 1
inheritance/dependency/RAG extension fields through
`compatibility.capsule_1_extensions` without giving them Capsule 2 authority.
It preserves only the legacy access aliases `open`, `protected`, and `runtime`
through `compatibility.capsule_1_access`; Capsule 2 itself always uses
`public`, `licensed`, or `remote`. These values must map exactly as
`open`/`public`, `protected`/`licensed`, and `runtime`/`remote`; the builder and
adapter reject any mismatched pair. The public builder rejects a Capsule 1 value
whose domain, judgment version, access, or E does not match the supplied
manifest and digest evidence.

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
