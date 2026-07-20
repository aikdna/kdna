# Runtime Capsule Contract

**Status:** current normative Runtime projection contract

**Schema:** [runtime-capsule.schema.json](./runtime-capsule.schema.json)

**Compatibility coordinate:** `0.1.0`

The Runtime Capsule is the sole Agent-facing projection emitted after a final
packaged asset passes validation and authorization. It is not the raw payload,
an authoring source directory, a quality claim, or proof that a model used the
judgment.

## 1. Identity and shape

Every Capsule is a closed object with:

```json
{
  "type": "kdna.runtime-capsule",
  "contract_version": "0.1.0",
  "asset": {
    "asset_id": "kdna:example:asset",
    "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
    "version": "1.0.0",
    "judgment_version": "1.0.0"
  },
  "digests": {},
  "signature": { "state": "absent" },
  "access": "public",
  "profile": "compact",
  "context": {},
  "trace": {}
}
```

`asset.asset_id` is the canonical human-readable identity. `asset.asset_uid`
is the globally unique identity. `version` and `judgment_version` remain
separate release and semantic-judgment coordinates.

There is no alternate public Capsule generation and no compatibility adapter.
An unknown `contract_version` fails closed.

## 2. Digest responsibilities

`digests` conforms to [digest-evidence.schema.json](./digest-evidence.schema.json)
and keeps these values separate:

| Name | Basis | Responsibility |
| --- | --- | --- |
| A | `kdna.digest-basis.container-bytes` | SHA-256 of the final packaged `.kdna` bytes |
| C | `kdna.digest-basis.content-tree` | canonical content-tree identity |
| E | `kdna.digest-basis.runtime-entry-set` | raw `kdna.json` and `payload.kdnab` entry-set identity |

Each record states its value, basis, comparison state, expected value, and
source. `matched`, `not_compared`, `mismatched`, and `unavailable` are evidence
states, not trust or quality labels. A mismatched required digest blocks
Capsule construction.

P, the Runtime Capsule delivery digest, is deliberately detached from the
Capsule it hashes. It is computed over the exact canonical Capsule and appears
in the Agent Host request, receipt, and Judgment Trace.

## 3. Projection profiles

| Profile | Intended projection |
| --- | --- |
| `index` | discovery identity and bounded metadata |
| `compact` | minimum sufficient reusable judgment context |
| `scenario` | task-relevant scenario context |
| `full` | authorized full judgment projection for audit or migration |

The requested profile controls `context`. Implementations must not emit one
shape while labeling it as another profile. `compact` preserves scoped
`highest_question`, `worldview`, ordered `value_order`, `judgment_role`,
applicability-aware axioms, boundaries, self-checks, failure modes, and every
declared pattern. An implementation that cannot retain those semantics must
fail closed rather than silently truncate them.

## 4. Trace facts

The Capsule `trace` records only loading facts required by the schema:
packaged-file or packaged-bytes input, CBOR payload, Core loader, load time,
schema-valid state, signature state, and selected projection profile.

These facts do not establish semantic consumption, behavioral influence,
judgment quality, or model conformance.

The Capsule deliberately carries no asset-level quality, risk, trust,
recommendation, certification, or production-readiness field. A Host may apply
its own task-scoped policy or consume an issuer-scoped external assessment, but
neither conclusion becomes an intrinsic property of the asset or a Core fact.

## 5. Consumer rules

A compatible consumer must:

1. obtain the Capsule through Core or an implementation that proves the same
   validation, authorization, digest, and projection behavior;
2. never use direct payload decoding as an Agent-loading shortcut;
3. treat loaded judgment as scoped context rather than universal truth;
4. preserve applicability, boundary, and failure-risk information;
5. avoid logging decrypted licensed context;
6. keep technical validity, provenance, execution evidence, and content quality
   as separate judgments.

Single-asset loading is the foundation. Cluster execution may coordinate
multiple already-authorized Capsules, but it cannot weaken this contract.
