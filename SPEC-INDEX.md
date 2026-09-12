# KDNA Specification Index

Status: stable index of normative documents

This index lists every normative KDNA document, its stable path, and its
version status. An external implementer reaches the complete format contract
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

| Responsibility | Normative document | Schema |
|---|---|---|
| Envelope AEAD (`kdna.envelope.aead`) | [`rfcs/RFC-0018-envelope-aead.md`](rfcs/RFC-0018-envelope-aead.md) | [`specs/envelope-aead.schema.json`](specs/envelope-aead.schema.json) |
| External key grant | [`rfcs/RFC-0019-account-device-external-key-grant.md`](rfcs/RFC-0019-account-device-external-key-grant.md) | [`schema/external-key-grant.schema.json`](packages/kdna-core/schema/external-key-grant.schema.json) |
| Crypto profiles | [`specs/kdna-crypto-profiles.md`](specs/kdna-crypto-profiles.md) | — |

## Version status

Every normative document carries one lifecycle state (see
[`rfcs/README.md`](rfcs/README.md)): `Active`, `Deprecated`, or `Removed`.
All documents listed above are `Active` at the current coordinates. A document
moves `Active -> Deprecated -> Removed` and is never removed without a
12-month deprecation window.

## Reference implementation

The reference implementation is [`@aikdna/kdna-core`](packages/kdna-core/).
Conformance fixtures live in [`conformance/`](conformance/).

## Unpublished next-version design — not Active

Status: **UNPUBLISHED_DESIGN_TARGET / NOT_IMPLEMENTED**. This appendix records
reviewable design decisions only. It does not change any Active 0.1 coordinate
or lifecycle statement above, issue a deprecation notice, start the 12-month
window, or claim that a public implementation/artifact exists.

- [Public contract decisions](specs/public-contract-decisions.json): chosen
  digest domains, authority boundaries and exact next-version tuple.
- [Public version policy](specs/public-version-policy.md): compatibility
  rejection, evidence axes and consumer rebinding responsibilities.
- [Public source map](specs/public-source-map.json): planned sole editable
  semantic source and generated/consumer dependencies; not yet generated.
- [Read contract](specs/read-contract.md): typed public Read design and Host
  disclosure boundary for planned `@aikdna/kdna-read@0.1.0`.
- [Decision vectors](conformance/public-contract-decision-vectors.json):
  concrete acceptance/rejection expectations, **NOT_RUN**, not conformance PASS.

The new design targets container/payload 0.2.0, Core 0.2.0, Canonical IR 0.1.0,
Runtime Capsule/Consumption Plan/Agent Host/Judgment Trace 0.2.0 and Read 0.1.0.
The complete exact tuple and separate unpublished package candidates are in the
decision and version-policy files. These design artifacts require independent
acceptance before a separately authorized semantic-source or implementation
package; they are not the complete normative/generated closure.
