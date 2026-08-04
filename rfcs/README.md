# KDNA RFC Index

KDNA is an open protocol. Protocol-level changes should be proposed as RFCs
before they affect the asset format, optional distribution, runtime contract, or
evaluation governance.

Current initial RFC set:

- [RFC-0001: KDNA Asset Format](./RFC-0001-kdna-asset-format.md)
- [RFC-0002: Optional Distribution Trust Model](./RFC-0002-registry-trust-model.md)
- RFC-0003: Evaluation Evidence
- [RFC-0004: Runtime Loading Contract](./RFC-0004-runtime-loading-contract.md)
- [RFC-0005: Composition Policy](./RFC-0005-composition-policy.md)
- [RFC-0006: Provenance, Signing, and Transparency](./RFC-0006-provenance-signing-transparency.md)
- [RFC-0007: Canonical Authoring and Asset Build Pipeline](./RFC-0007-canonical-authoring-build-pipeline.md)
- [RFC-0008: Encrypted and Licensed KDNA Assets](./RFC-0008-encrypted-licensed-kdna-assets.md)
- [RFC-0009: Password-Protected KDNA Assets](./RFC-0009-password-protected-kdna-assets.md)
- [RFC-0010: KDNA Fidelity Protocol](../specs/fidelity-protocol.md)
- [RFC-0011: KDNA Product Runtime](../docs/product-runtime.md)
- [RFC-0012: KDNA Artifact Contract](../specs/RFC-0012-artifact-contract.md)
- [RFC-0018: KDNA Canonical Envelope Profile — `kdna.envelope.aead`](./RFC-0018-envelope-aead.md) — draft pre-release candidate for the first public envelope wire contract. Three known-answer test vectors live at `conformance/envelope-aead/`. The unversioned `scrypt-sha256` KDF is mandatory, `argon2id` is optional, and `profile_version: 0.1.0` carries the wire coordinate. The profile non-collapse invariant forbids silent cross-KDF or cross-AEAD migration.

## RFC States

- `draft` — proposed, not binding.
- `accepted` — approved for implementation.
- `active` — implemented and part of the current contract.
- `superseded` — replaced by a newer RFC.
- `withdrawn` — intentionally abandoned.

## Feature Lifecycle

Every protocol feature (a format field, profile, command, or wire contract)
carries one lifecycle state, independent of its RFC state:

- `Active` — part of the current contract; implementations must support it.
- `Deprecated` — still supported but scheduled for removal; implementations
  SHOULD warn on use and migrate callers.
- `Removed` — no longer part of the contract; implementations must reject it
  fail-closed.

A feature moves `Active -> Deprecated -> Removed`. A feature is never removed
without first passing through `Deprecated`.

## Deprecation Window

A deprecated feature stays supported for at least **12 months** after the
deprecation is announced in an `active` RFC before it may move to `Removed`
(modeled on the Model Context Protocol's deprecation practice). During the
window:

- The deprecation RFC names the feature, the replacement, and the removal date.
- Implementations SHOULD emit a machine-readable deprecation notice on use.
- The removal date may be extended, but never moved earlier, once announced.

A feature that never had an `Active` window (a withdrawn draft) may be removed
without a deprecation window.

## Required Sections

Every RFC should include: summary, motivation, normative rules,
compatibility impact, conformance requirements, security considerations, and
open questions.
