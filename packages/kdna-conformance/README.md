# @aikdna/kdna-conformance

KDNA conformance suite: fixtures, runner, and hostile cases for third-party
implementations to prove the current asset-first KDNA contract.

> **Status:** the published npm incumbent is `0.1.0`. This source tree is the
> `0.2.0` line, a source candidate that adds the byte-level interop vectors
> and is not yet published to npm.

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

## Byte-level interop vectors

`vectors/` packages the canonical byte-level interop vectors so a second
implementation can verify interoperability with this artifact plus the RFCs,
without cloning any repository:

| Set | Contract |
|-----|----------|
| `vectors/signature/vectors.json` | `kdsig.ed25519` asset signatures (RFC-0021 M1) |
| `vectors/envelope-aead/` | password-envelope AEAD vectors (scrypt, Argon2id) |
| `vectors/authorization/` | authorization LoadPlan cases with fixtures and expected goldens (RFC-0014) |

`vectors/manifest.json` binds every vector file by exact byte count and
sha256, and names the vector set version. To verify interop: parse each
vector with your implementation, reproduce the expected outputs recorded in
the vector files, and confirm your results hash-match the manifest. Vector
content is generated only by the canonical generators in the KDNA Core
repository and is copied here byte-identically; a CI test proves the packaged
bytes never drift from the canonical tree.

The RFCs live at <https://github.com/aikdna/kdna/tree/main/rfcs>. Report
your claim in the public format from
[CONFORMANCE.md](https://github.com/aikdna/kdna/blob/main/CONFORMANCE.md):
command, implementation version, spec version, run summary, known deviations.

## License

Apache-2.0
