# KDNA Core Specification

Status: stable current contract

Container coordinate: `format_version: "0.1.0"`

Payload coordinate: `compatibility.profile_version: "0.1.0"`

KDNA is a portable judgment-asset protocol for AI runtimes. This specification
defines the distribution container and the responsibility boundaries needed to
verify, authorize, project, deliver, and trace one asset. It does not define how
an author extracts judgment from source material, and it does not certify that
an asset's judgment is correct.

Normative schemas live in [`schema/`](schema/). The reference implementation is
[`@aikdna/kdna-core`](packages/kdna-core/).

## 1. Distribution container

A runtime asset is one immutable `.kdna` ZIP file. Its first entry is
`mimetype`, stored without compression, with the exact bytes:

```text
application/vnd.kdna.asset
```

Required entries are:

| Entry | Responsibility |
|---|---|
| `mimetype` | Unambiguous container detection |
| `kdna.json` | Public identity, compatibility, access, and payload metadata |
| `payload.kdnab` | CBOR-encoded judgment payload or encrypted envelope |
| `checksums.json` | Runtime entry-set integrity evidence |

Authoring source files, reports, build receipts, credentials, and decrypted
plaintext are not distribution entries. Runtimes MUST reject forbidden
top-level authoring entries and path traversal.

## 2. Manifest

`kdna.json` MUST validate against
[`schema/manifest.schema.json`](schema/manifest.schema.json). The required
fields are:

```json
{
  "format_version": "0.1.0",
  "asset_id": "kdna:example:decision",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Example decision judgment",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "created_at": "2026-07-15T00:00:00Z",
  "updated_at": "2026-07-15T00:00:00Z",
  "compatibility": {
    "min_loader_version": "0.18.1",
    "profile": "kdna.payload.judgment",
    "profile_version": "0.1.0"
  },
  "payload": {
    "path": "payload.kdnab",
    "encoding": "cbor",
    "encrypted": false
  },
  "access": "public"
}
```

`creator` is optional provenance. Its absence does not block format validity or
loading. When present, `creator.name` MUST be non-empty. Provenance is not a
trust or quality claim.

`access`, when present, is exactly one of:

- `public`: no entitlement is required;
- `licensed`: authorization is required before plaintext projection;
- `remote`: local plaintext projection is not permitted.

Unknown access values and removed aliases fail closed.

## 3. Judgment payload

An unencrypted `payload.kdnab` is strict CBOR and MUST validate against
[`schema/payload-profile.schema.json`](schema/payload-profile.schema.json).
The payload declares:

```json
{
  "profile": "kdna.payload.judgment",
  "profile_version": "0.1.0",
  "core": {
    "highest_question": "What bounded qualitative decision does this asset help make?",
    "axioms": []
  }
}
```

`worldview`, `value_order`, `judgment_role`, axioms, boundaries, patterns,
scenarios, cases, self-checks, and failure modes are judgment content. A loader
MUST preserve every validated field selected by the requested projection. It
MUST NOT silently trim, reorder, reinterpret, or invent that content.

How a source book, thinker, expert, or dataset becomes this payload is an
authoring concern outside the runtime protocol.

## 4. Digest responsibility

The protocol distinguishes three digests:

| Symbol | Meaning |
|---|---|
| **A** | SHA-256 of the immutable packaged `.kdna` bytes |
| **C** | SHA-256 of decoded judgment payload bytes |
| **E** | Canonical runtime entry-set digest recorded by `checksums.json` |

A, C, and E are not interchangeable. A signed entitlement that binds an asset
MUST bind A. `checksums.json` carries E and per-entry evidence; it does not
retroactively become A.

## 5. Validation and authorization

Validation independently reports container format, manifest schema, payload,
checksums, and load-contract results. `overall_valid` is true only when every
required gate succeeds.

`planLoad` performs no plaintext projection. It returns a content-neutral plan
that says whether loading is ready, blocked, needs authorization input, or
requires a remote runtime. A caller-supplied status string is never sufficient
authorization. Password or external account/device authorization MUST verify
the corresponding cryptographic contract before a licensed asset becomes
ready.

Decrypted plaintext and content-encryption keys remain in volatile memory and
MUST NOT be written to logs, traces, reports, caches, or temporary files.

## 6. Runtime projection

An authorized JSON load emits the sole public Runtime Capsule defined by
[`schema/runtime-capsule.schema.json`](schema/runtime-capsule.schema.json). Its
contract coordinate is `0.1.0` and its type is `kdna.runtime-capsule`.

The Capsule preserves:

- asset identity and judgment version;
- A, C, and E evidence with explicit comparison state;
- signature and access evidence;
- the selected projection profile and context;
- load facts that were actually observed.

Producing a Capsule proves delivery of a verified projection. It does not prove
that a model semantically understood or faithfully applied the judgment.

## 7. Agent Host and trace boundary

The stable ConsumptionPlan, Agent Host request/receipt, and JudgmentTrace
schemas live in [`specs/`](specs/) and have executable vectors in
[`conformance/runtime-contract/`](conformance/runtime-contract/).

The evidence chain distinguishes:

1. projection built;
2. Capsule delivered;
3. Host execution observed;
4. semantic consumption observed, not observed, or unproven;
5. behavioral conformity separately evaluated.

No implementation may collapse these states into a claim that an agent
"consumed" or "followed" KDNA when only delivery or process completion was
observed.

## 8. Cryptographic profiles

The stable password envelope is defined by
[`RFC-0018`](rfcs/RFC-0018-envelope-aead.md). The account/device external key
grant is defined by
[`RFC-0019`](rfcs/RFC-0019-account-device-external-key-grant.md). Unknown
profiles, versions, algorithms, fields required by their AAD, or failed
authentication MUST fail closed.

## 9. Conformance

A conforming implementation MUST pass the relevant executable suites without
editing their committed vectors:

```bash
npm test
npm run conformance
npm run conformance:canonical
npm run conformance:envelope-aead
npm run conformance:runtime-contract
npm run audit:post-cutover
```

The checked-out public tree and the published Core tarball describe one stable
contract. Git-tracked history and migration material remain subject to the
same post-cutover naming audit as current runtime source; their presence does
not make removed shapes runtime-valid.
