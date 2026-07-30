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

Required protocol entries are:

| Entry | Responsibility |
|---|---|
| `mimetype` | Unambiguous container detection |
| `kdna.json` | Public identity, compatibility, access, and payload metadata |
| `payload.kdnab` | CBOR-encoded judgment payload or encrypted envelope |

Optional protocol entries are:

| Entry | Responsibility |
|---|---|
| `checksums.json` | Runtime entry-set integrity evidence; emitted by official Creation Writers |
| `attachments/` | Supplementary bytes governed by the manifest and loader policy |

The absence of `checksums.json` is not a format error. When the entry is
present, its schema and declared digests MUST verify. An exporter that presents
itself as an official KDNA Creation Writer MUST emit the canonical four-entry
baseline: the three required protocol entries plus `checksums.json`.

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
    "min_loader_version": "0.20.0",
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
    "axioms": [
      {
        "statement": "Prefer the reversible option while required evidence is incomplete.",
        "applies_when": ["choosing between reversible and irreversible actions"]
      }
    ]
  }
}
```

`highest_question` is an optional authoring concept, but when present it is
non-empty. Every payload contains at least one non-empty judgment statement
and identifies its problem domain, role, boundary, or applicability. This is a
content-neutral minimum: it does not require a human author or claim that the
judgment is correct.

`worldview`, `value_order`, `judgment_role`, axioms, boundaries, patterns,
scenarios, cases, self-checks, and failure modes are judgment content. A loader
MUST preserve every validated field selected by the requested projection. It
MUST NOT silently trim, reorder, reinterpret, or invent that content.

How a source book, thinker, expert, or dataset becomes this payload is an
authoring concern outside the runtime protocol.

## 4. Format validity and creation acceptance

Core reports whether an asset is **Format Valid**: its container, manifest,
payload, integrity evidence when present, compatibility, authorization, and
projection satisfy the public technical contracts. Format validity is
content-neutral. It does not prove who formed or confirmed the judgment,
whether the judgment represents a person or organization, whether its sources
are sufficient, or whether it passed semantic tests.

A Creation Engine may separately report **Creation Accepted** under its own
declared creation mode, scope, source, confirmation, and semantic-test
contracts. Creation acceptance does not change Core validity, and Core validity
does not imply creation acceptance. Compilers and loaders MUST NOT synthesize a
human confirmation or infer creation acceptance from successful validation.

Official Creation Writer output is intentionally stricter than the minimum
Core payload. It explicitly declares the highest question, scoped worldview,
ordered value priorities, judgment role, and global boundaries, and it emits
`checksums.json`. These authoring requirements do not make the same fields
universal Core requirements for assets produced by other compatible writers.
See [Creation Output Boundary](specs/creation-output-boundary.md).

## 5. Digest responsibility

The protocol distinguishes three digests:

| Symbol | Meaning |
|---|---|
| **A** | SHA-256 of the immutable packaged `.kdna` bytes |
| **C** | SHA-256 of decoded judgment payload bytes |
| **E** | Canonical runtime entry-set digest recorded by `checksums.json`, when present |

A, C, and E are not interchangeable. A signed entitlement that binds an asset
MUST bind A. When `checksums.json` is present, it carries E and per-entry
evidence; it does not retroactively become A. A Core-valid three-entry asset
has no declared E evidence.

## 6. Validation and authorization

Validation independently reports container format, manifest schema, payload,
checksums, and load-contract results. The checksums gate succeeds without
evidence when the optional entry is absent, and verifies the evidence when it
is present. `overall_valid` is true only when every applicable gate succeeds.

`planLoad` performs no plaintext projection. It returns a content-neutral plan
that says whether loading is ready, blocked, needs authorization input, or
requires a remote runtime. A caller-supplied status string is never sufficient
authorization. Password or external account/device authorization MUST verify
the corresponding cryptographic contract before a licensed asset becomes
ready.

Decrypted plaintext and content-encryption keys remain in volatile memory and
MUST NOT be written to logs, traces, reports, caches, or temporary files.

## 7. Runtime projection

An authorized JSON load emits the sole public Runtime Capsule defined by
[`specs/runtime-capsule.schema.json`](specs/runtime-capsule.schema.json). Its
contract coordinate is `0.1.0` and its type is `kdna.runtime-capsule`.

The Capsule preserves:

- asset identity and judgment version;
- A, C, and E evidence with explicit comparison state;
- signature and access evidence;
- the selected projection profile and context;
- load facts that were actually observed.

Producing a Capsule proves delivery of a verified projection. It does not prove
that a model semantically understood or faithfully applied the judgment.

## 8. Agent Host and trace boundary

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

## 9. Cryptographic profiles

The stable password envelope is defined by
[`RFC-0018`](rfcs/RFC-0018-envelope-aead.md). The account/device external key
grant is defined by
[`RFC-0019`](rfcs/RFC-0019-account-device-external-key-grant.md). Unknown
profiles, versions, algorithms, fields required by their AAD, or failed
authentication MUST fail closed.

## 10. Conformance

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
