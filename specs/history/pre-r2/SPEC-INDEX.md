# KDNA Specification Index

The local unpublished `grammar.3` candidate is defined by [the single machine source](specs/public-semantic-source.json), [Read 0.5](specs/read-contract.md), [native execution 0.2](specs/execution-contract-0.2.md) and [version policy](specs/public-version-policy.md). Reference implementations and tests exist; independent acceptance is a separate byte-bound receipt. Publication is not claimed. Existing normative 0.1 lines below retain their original lifecycle.

Status: stable index of normative documents and explicitly marked candidates

This index lists normative KDNA documents and draft candidates, their stable
paths, and their version status. An external implementer reaches the complete format contract
from this one page. The single readable format contract is
[`SPEC.md`](SPEC.md); this index points to every normative document it draws
on.

Coordinates:

- Container coordinate: `format_version: "0.1.0"`
- Payload coordinate: `compatibility.profile_version: "0.1.0"`

## Format contract (the four-in-one)

The single readable format contract consolidates the container, manifest,
payload, and load-contract responsibilities:

| Responsibility | Normative document | Schema |
|---|---|---|
| Distribution container | [`SPEC.md` §1](SPEC.md), [`specs/container.md`](specs/container.md) | — |
| Manifest (`kdna.json`) | [`SPEC.md` §2](SPEC.md), [`docs/core/manifest.md`](docs/core/manifest.md) | [`schema/manifest.schema.json`](packages/kdna-core/schema/manifest.schema.json) |
| Judgment payload (`payload.kdnab`) | [`SPEC.md` §3](SPEC.md), [`docs/core/payload-profile.md`](docs/core/payload-profile.md) | [`schema/payload-profile.schema.json`](packages/kdna-core/schema/payload-profile.schema.json) |
| Load contract + profiles | [`docs/core/load-contract.md`](docs/core/load-contract.md), [`docs/core/load-profiles.md`](docs/core/load-profiles.md) | [`schema/load-contract.schema.json`](packages/kdna-core/schema/load-contract.schema.json) |

## Runtime contract

| Responsibility | Normative document | Schema |
|---|---|---|
| Runtime Capsule | [`specs/runtime-capsule.md`](specs/runtime-capsule.md) | [`schema/runtime-capsule.schema.json`](packages/kdna-core/schema/runtime-capsule.schema.json) |
| Consumption Plan | [`specs/consumption-plan.schema.json`](specs/consumption-plan.schema.json) | same |
| Agent Host request/receipt | [`specs/agent-host-request.schema.json`](specs/agent-host-request.schema.json), [`specs/agent-host-receipt.schema.json`](specs/agent-host-receipt.schema.json) | same |
| Judgment Trace | [`specs/judgment-trace.schema.json`](specs/judgment-trace.schema.json) | same |
| Digest evidence | [`specs/digest-evidence.schema.json`](specs/digest-evidence.schema.json) | same |

## Cryptographic profiles

| Responsibility | Document | Schema | Publication / adoption status |
|---|---|---|---|
| Envelope AEAD (`kdna.envelope.aead`) | [RFC-0018](rfcs/RFC-0018-envelope-aead.md) | [Envelope schema](specs/envelope-aead.schema.json) | Draft, pre-release candidate; local algorithm conformance is separate from Core admission |
| External key grant | [RFC-0019](rfcs/RFC-0019-account-device-external-key-grant.md) | [Envelope](specs/external-grant-envelope.schema.json), [grant](specs/external-key-grant.schema.json) | Draft; retained helper implementation, no grammar.3 protected admission |
| Crypto profile identities | [Crypto profiles](specs/kdna-crypto-profiles.md) | — | Candidate map; preserves distinct predecessor profiles and their existing commitments |
| Protection adoption | [Protection adoption boundary](specs/protection-adoption.md) | — | Current capability statement and requirements for a future explicit integration; no new admission API |

## Version status

RFC status and feature lifecycle are separate axes (see
[`rfcs/README.md`](rfcs/README.md)). An RFC can be `draft`, `accepted`, `active`,
`superseded`, or `withdrawn`; a feature with an established contract can be
`Active`, `Deprecated`, or `Removed`. Inclusion in this index does not promote
a draft to a published stable profile or establish support in every package.
RFC-0018 and RFC-0019 retain their explicit Draft / pre-release status.

Existing Active 0.1 features and predecessor-profile support commitments remain
in force at their original coordinates. This clarification neither deprecates
nor removes them and starts no deprecation clock. Their
`Active -> Deprecated -> Removed` lifecycle and minimum 12-month deprecation
window remain unchanged. A separate candidate runtime can declare unsupported
inputs without rewriting the old contract; consumers must bind to the exact
line and capability declaration they use.

## Reference implementation

The reference implementation is [`@aikdna/kdna-core`](packages/kdna-core/).
Conformance fixtures live in [`conformance/`](conformance/).

## Current unpublished grammar.3 candidate

Status: **UNPUBLISHED_CANDIDATE / REFERENCE_IMPLEMENTATION**. This is a local implemented contract, not an Active published replacement of the 0.1 line. Source inventories, executed tests, independent acceptance, installed consumers and publication are distinct evidence.

| Responsibility | Authority and generated format |
|---|---|
| Sole editable semantic source | [public-semantic-source.json](specs/public-semantic-source.json) |
| Manifest / Payload | [Manifest schema](schema/manifest-0.2.schema.json), [Payload schema](schema/payload-profile-0.2.schema.json) |
| Core / Canonical IR | [Canonical IR schema](specs/canonical-ir.schema.json), [decisions](specs/public-contract-decisions.json) |
| Read and disclosure | [Read contract](specs/read-contract.md), [schema](specs/read-contract.schema.json) |
| Native execution 0.2 | [complete contract](specs/execution-contract-0.2.md), [Capsule](schema/runtime-capsule-0.2.schema.json), [Plan](schema/consumption-plan-0.2.schema.json), [Request](schema/agent-host-request-0.2.schema.json), [Receipt](schema/agent-host-receipt-0.2.schema.json), [Trace](schema/judgment-trace-0.2.schema.json) |
| PackageSet node | [surface contract](specs/package-set-node.md), [schema](specs/package-set-node.schema.json), [types](specs/package-set-node.d.ts) |
| Components / static policy | [component semantics](specs/component-semantics.md), [static policy](specs/static-policy.md) |
| Diagnostics / vocabulary | [diagnostics](specs/public-diagnostics.json), [vocabulary](specs/public-vocabulary.json) |
| Evolution / provenance | [version policy](specs/public-version-policy.md), [source map](specs/public-source-map.json), [generation manifest](specs/public-generation-manifest.json) |
| Verification | [decision vectors](conformance/public-contract-decision-vectors.json), `npm run conformance:public-contract`, `npm run conformance:public-obligations`, Core `test/public-*.test.js`, Read `test/*.test.js` |

Exact tuple: Container `0.5.0`; Payload `kdna.payload.judgment` / `0.4.0`; Core `kdna.core/0.7.0`; IR `kdna.canonical-ir/0.5.0`; Capsule/Plan/Host/Trace `0.2.0`; Read `kdna.read/0.5.0`. Actual package labels are Core `0.34.0-rc.combination.1` and Read `0.9.0-rc.combination.1`, with an exact Core peer. Stable schema path suffixes inherited from earlier candidate work are not coordinates; the generated `$id`, closed contract fields and complete tuple define the version.

Grammar.3 gives lifecycle replacements complete asset/judgment identity and closes native 0.2 execution formats. It also corrects critical-extension admission, body-free catalog fallback, language retention, diagnostics and package type closure. It intentionally requires new coordinates and rejects old tuples; it never rewrites old assets or silently converts them.

Historical unpublished `authoring.4`, `grammar.1` and `grammar.2` coordinates, proposed package labels and accepted-design digests remain in `public-semantic-source.json#/target_lines`. Grammar.2 actual package manifests still used authoring.4 labels; that historical mismatch is recorded separately. These lines were unpublished and issue no deprecation notice or clock for Active 0.1. The old runtime documents above define 0.1 only, while this section links complete native 0.2 contracts.

### Independent authoring workflow module

The current authoring descriptor is `kdna.authoring-workflow/2` version `2.0.0`, adopted explicitly by exact contract digest and separately verified implementation identity. It does not change the grammar.3 runtime tuple. Original /1 and its exact producer/package evidence remain historical and cannot be relabeled. See [authoring workflow](specs/authoring-workflow.md) and the separate-module section of [version policy](specs/public-version-policy.md).

## Protection /1 B1 implementation candidate

- [Protection admission /1, version1.0.0](specs/protection-admission.md): optional
  Manifest.entitlement, trusted caller/delivery boundaries and closed result
  unions and explicit Node callable surfaces; independent runtime acceptance and
  same-coordinate compatibility are separate, pending reviews.
- [Definition schema](specs/protection-admission.schema.json) and
  [generated types](specs/protection-admission.d.ts): opaque authority is not JSON.
- [Checksums document /1, version1.0.0](specs/checksums-document-1.schema.json): new
  document using existing E0.2; old checksums0.1 and kdsig0.1 remain distinct.
