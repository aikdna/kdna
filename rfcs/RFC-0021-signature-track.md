# RFC-0021: KDNA Signature Track

Status: draft — M1 implemented and bound (pre-release candidate); M2–M6 not
yet implemented.

This document names the **signature track**: the ordered work stream that
turns the long-term signing model of
[RFC-0006](./RFC-0006-provenance-signing-transparency.md) into a concrete,
independently verifiable wire contract. Milestone **M1 (payload
canonicalization)** is implemented by this repository's JavaScript Core and
Python Core, both of which pass the same known-answer vectors; the remaining
milestones stay non-binding until their own implementations land, following
the pattern used by [RFC-0018](./RFC-0018-envelope-aead.md).

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

Non-goals:

- no keyless/OIDC signing decision (kept as an open question in RFC-0006);
- no transparency-log operator selection;
- no judgment-quality or trust attestation — signatures never prove expertise,
  truthfulness, safety, or fitness for purpose.

## Track Milestones

Each milestone is a separate future RFC or an amendment to this one. A
milestone binds only after it reaches implementation with at least two
independent verifier implementations passing its known-answer vectors.

1. **M1 — Payload canonicalization. IMPLEMENTED AND BOUND (pre-release
   candidate).** Freezes the exact bytes that are signed, as a deterministic
   function of the asset's canonical form. Implemented by the JavaScript Core
   (`packages/kdna-core/src/signature.js`) and the Python Core
   (`python-sdk/kdna/core/signature.py`); both pass the known-answer vectors
   under `conformance/signature/`. The bound wire contract is the Normative
   Rules section below.
2. **M2 — Identity and key rules.** Fix the key type(s), identity binding, and
   scope rules; define how an identity is represented in the bundle. Not
   implemented.
3. **M3 — Bundle wire format evolution.** Define how the signature bundle
   layout and its `profile_version`-style wire coordinate evolve beyond the
   M1 shape without collapse. Not implemented.
4. **M4 — Rotation and revocation.** Define rotation/revocation metadata and
   the fail-closed behavior for revoked or expired signing material. Not
   implemented.
5. **M5 — Offline verification contract.** Define the full conforming-verifier
   acceptance/rejection surface across runtimes, extending the M1 vectors.
   Not implemented.
6. **M6 — 1.0 compatibility.** Define whether any transition window ever
   accepts legacy 1.0 `kdna.json.signature` declarations directly, per the
   feature lifecycle in this repository's RFC index. Current handling is the
   migration rule in the Normative Rules below. Not implemented.

## Normative Rules (M1, pre-release candidate)

### R1 — Entry and profile coordinate

A signed asset carries exactly one optional top-level container entry named
`signature.kdsig`. The entry is UTF-8 JSON. Every bundle MUST carry the
literal `profile` value `kdsig.ed25519` and the literal `profile_version`
value `0.1.0`. Any other profile value is rejected with
`KDNA_SIGNATURE_PROFILE_UNSUPPORTED`; any other profile version is rejected
with `KDNA_SIGNATURE_VERSION_UNSUPPORTED`.

### R2 — Bundle shape

The bundle is a JSON object with exactly these string fields and no others:

| Field | Value |
|---|---|
| `algorithm` | `ed25519` |
| `content_digest` | `sha256:` followed by 64 lowercase hex characters |
| `profile` | `kdsig.ed25519` |
| `profile_version` | `0.1.0` |
| `public_key` | the raw 32-byte Ed25519 public key as 64 lowercase hex characters |
| `signature` | the raw 64-byte Ed25519 signature as 128 lowercase hex characters |

Missing fields, extra fields, non-string values, or non-lowercase-hex
encodings are rejected with `KDNA_INTEGRITY_SIGNATURE_FAILED`. Verification
MUST NOT interpret unknown fields.

### R3 — Signing payload

The signed bytes are the UTF-8 encoding of:

```text
kdsig.ed25519:0.1.0:<content_digest>
```

where `<content_digest>` is the asset content digest computed exactly as
defined by `docs/CANONICALIZATION.md`, with the `signature.kdsig` entry
itself excluded from the canonical entry set. A signature can therefore never
cover itself, and can never be replayed across profiles, profile versions, or
assets.

### R4 — Verification is offline and fail-closed

Verification requires only the container bytes and the bundle's own public
key. No network access and no third-party service are permitted. Any
malformed, unsupported, or unverifiable bundle MUST reject the asset:
validation reports `signature_valid: false`, the LoadPlan blocks with the
matching issue code, and loading refuses the asset. A failed signature MUST
NOT downgrade to "unsigned" or to any warning-only path.

### R5 — Absent signatures

An asset without `signature.kdsig` remains valid; verification reports the
state `absent`. Callers MAY require a signature (for example through a
`requireSignature` verification option or an `expectedPublicKey` pin); a
required-but-absent signature is rejected, never fabricated.

### R6 — Provenance is not trust

The bundle carries its own public key. A valid signature proves integrity and
key-bound provenance only: the holder of that key signed that canonical
content. Trusting the key is the consumer's pinning decision. Key identity
binding, rotation, and revocation belong to later milestones; a signature
never proves expertise, truthfulness, safety, or fitness for purpose.

### R7 — Migration from the 1.0 `kdna.json.signature` field

The 1.0-era manifest `signature` / `signatures` declarations never froze a
signing payload, so they are not a verifiable contract. They remain rejected
by the manifest schema, and this track MUST NOT reinterpret them. The
migration path is reissue: an asset carrying a legacy declaration is
re-packed and signed under R1–R4, producing a `signature.kdsig` bundle.
Whether any future transition window ever accepts legacy declarations
directly is M6.

### R8 — Non-collapse

A bundle MUST NOT be silently migrated across key types, profiles, or profile
versions. A verifier that does not support the declared coordinate rejects
it; evolution is explicit and versioned.

## Conformance Requirements

M1 conformance is demonstrated by the known-answer vectors under
`conformance/signature/`:

- `vectors.json` pins the signer key, the unsigned asset entries, the content
  digest, the signing payload, the bundle bytes, the signed container hash,
  the negative cases, and the wrong-key pinning semantics;
- the JavaScript runner (`conformance/signature/run.mjs`) and the Python
  tests (`python-sdk/tests/test_signature.py`) are the two independent
  verifier implementations that bind this milestone;
- the vectors are deterministic: Ed25519 and SHA-256 make regeneration
  byte-stable (`node scripts/generate-signature-vectors.mjs --check`).

Packaging the vectors as a standalone, externally consumable conformance
artifact is tracked as part of the ecosystem conformance work (S5) and feeds
M5.

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

1.0 assets keep the existing `kdna.json.signature` field rejected, per R7:
those declarations never defined a verifiable payload, so migration is
reissue, not reinterpretation. Any future bundle evolution introduced by this
track MUST preserve the ability to verify `kdsig.ed25519` M1 bundles, and any
removal of a wire coordinate follows the 12-month deprecation window defined
in the RFC index.

## Security Considerations

Signatures prove integrity and provenance. They do not prove expertise,
truthfulness, safety, or fitness for purpose. Key material must be handled by
the signer's own tooling; this track does not define key custody or escrow.
The conformance vectors use a public seed that must never be reused for real
signing. Because M1 bundles carry their own public key, consumers that need
to trust a specific signer MUST pin the expected public key; unpinned
verification establishes key-bound provenance, not trust in the key.

## Open Questions

- Should KDNA support keyless signing through OIDC identities (carried from
  RFC-0006)?
- Is a transparency log required for the first stable signature contract, or
  only for a later milestone?
- Does the bundle need to carry multiple coexisting signatures (e.g. author
  plus distributor), or is one signer per bundle the stable contract? M1
  ships one signature per bundle.
- How should M2 represent identity so that pinning can be expressed as a
  named author or organization rather than a raw key?
