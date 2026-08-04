# @aikdna/kdna-conformance

KDNA conformance suite: fixtures, runner, and hostile cases for third-party
implementations to prove the current asset-first KDNA contract.

## What conformance means

- `.kdna` packaged bytes are the Runtime asset object;
- `kdna.json` uses `format_version: "0.1.0"`;
- `payload.kdnab` is strict CBOR with an explicit payload profile version;
- validation verifies format, schema, payload, checksums, and load contract;
- LoadPlan gates every Runtime projection;
- authorized loading emits `kdna.runtime-capsule` with `contract_version: "0.1.0"`;
- a corrupted container fails closed.

Conformance proves the contract. It does not certify that an asset's judgment
is correct.

## Run against the reference implementation

```bash
npm install @aikdna/kdna-conformance
npx kdna-conformance
```

## Run against your own implementation

A third-party implementer points the runner at a module exposing the same
surface as `@aikdna/kdna-core` (`validate`, `planLoad`, `load`):

```bash
npx kdna-conformance --impl ./my-kdna-core.js
```

The runner produces a pass/fail report:

```text
KDNA conformance report — implementation: ./my-kdna-core.js
  passed: 4
  failed: 0
  PASS: container: valid asset passes validation
  PASS: loadplan: valid asset can load now
  PASS: runtime: load emits a runtime capsule
  PASS: hostile: corrupted container fails closed
```

## Fixtures

`fixtures/valid-asset.kdna` is a valid public judgment asset. The hostile
cases corrupt the container and assert fail-closed behavior.

## License

Apache-2.0
