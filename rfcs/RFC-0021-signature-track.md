# RFC-0021: KDNA Signature Track

Status: draft — placeholder. No implementation is bound to this RFC yet.

This document is a placeholder that reserves and scopes the **signature track**:
the ordered work stream that turns the long-term signing model of
[RFC-0006](./RFC-0006-provenance-signing-transparency.md) into a concrete,
independently verifiable wire contract. It deliberately does not fix byte-level
formats; those are pinned only when a track milestone produces a pre-release
candidate with known-answer test vectors, following the pattern used by
[RFC-0018](./RFC-0018-envelope-aead.md).

## Summary

KDNA assets carry human judgment that agents may load into real workflows.
Integrity and provenance must be verifiable offline by any implementation,
without implying that a signature proves the judgment is correct. This RFC
names the signature track, its milestones, and the invariants every milestone
must preserve, so that independent implementers can converge on one contract
instead of forking ad-hoc signing schemes.

## Motivation

RFC-0006 states the long-term model (canonical payloads, Ed25519 identity,
rotation/revocation, signature bundles, optional transparency logs, offline
verification) but is explicitly non-binding. Without a track, each runtime
(Node.js, Swift, Rust, others) risks inventing its own signature envelope,
which would fragment verification and defeat the point of an open protocol.

This track exists to sequence that work, keep it fail-closed, and make each
step independently implementable — the same property the conformance package
(`@aikdna/kdna-conformance`) targets for the load path.

## Scope and Non-Goals

In scope for the track:

- the exact signing payload and its canonicalization, aligned with
  `docs/CANONICALIZATION.md`;
- key identity and scope identity rules;
- key rotation and revocation metadata;
- the signature bundle wire format;
- offline verification requirements for every runtime;
- the migration path from the 1.0 `kdna.json.signature` field.

Non-goals for this placeholder:

- no keyless/OIDC signing decision (kept as an open question in RFC-0006);
- no transparency-log operator selection;
- no judgment-quality or trust attestation — signatures never prove expertise,
  truthfulness, safety, or fitness for purpose.

## Track Milestones

Each milestone is a separate future RFC or an amendment to this one. None is
binding until it reaches `accepted` with at least two independent verifier
implementations.

1. **M1 — Payload canonicalization.** Freeze the exact bytes that are signed,
   as a deterministic function of the asset's canonical form.
2. **M2 — Identity and key rules.** Fix the key type(s), identity binding, and
   scope rules; define how an identity is represented in the bundle.
3. **M3 — Bundle wire format.** Define the signature bundle layout and the
   `profile_version`-style wire coordinate used to evolve it without collapse.
4. **M4 — Rotation and revocation.** Define rotation/revocation metadata and
   the fail-closed behavior for revoked or expired signing material.
5. **M5 — Offline verification contract.** Define what a conforming verifier
   must accept and reject offline, plus known-answer test vectors.
6. **M6 — 1.0 compatibility.** Define how verifiers continue to accept 1.0
   Ed25519 `kdna.json.signature` assets during any transition window, per the
   feature lifecycle in this repository's RFC index.

## Invariants

Every milestone MUST preserve:

- **Fail-closed verification.** Any ambiguous, malformed, or unverifiable
  signature is rejected, never silently accepted or downgraded to "unsigned".
- **Non-collapse.** A bundle MUST NOT be silently migrated across key types or
  wire coordinates; evolution is explicit and versioned.
- **Provenance ≠ correctness.** A valid signature attests integrity and
  origin only.
- **Offline verifiability.** Verification MUST NOT require network access or a
  third-party service.

## Compatibility Impact

1.0 assets keep the existing `kdna.json.signature` field. Any bundle format
introduced by this track MUST preserve the ability to verify 1.0 Ed25519
signatures, and any removal of the legacy field follows the 12-month
deprecation window defined in the RFC index.

## Conformance Requirements

TBD per milestone. A milestone's conformance requirements bind only after at
least two independent verifier implementations pass its known-answer vectors,
mirroring the RFC-0018 pre-release process.

## Security Considerations

Signatures prove integrity and provenance. They do not prove expertise,
truthfulness, safety, or fitness for purpose. Key material must be handled by
the signer's own tooling; this track does not define key custody or escrow.

## Open Questions

- Should KDNA support keyless signing through OIDC identities (carried from
  RFC-0006)?
- Is a transparency log required for the first stable signature contract, or
  only for a later milestone?
- Does the bundle need to carry multiple coexisting signatures (e.g. author
  plus distributor), or is one signer per bundle the first contract?
