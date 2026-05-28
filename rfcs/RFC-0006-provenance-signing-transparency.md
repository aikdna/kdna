# RFC-0006: Provenance, Signing, and Transparency

Status: draft

## Summary

Define the long-term signing and provenance model for `.kdna` assets, including
canonical payloads, key rotation, identity binding, optional transparency logs,
and offline verification.

## Motivation

KDNA assets encode human judgment that AI agents may load into real workflows.
The ecosystem needs cryptographic integrity and provenance without implying
that a signature proves judgment correctness.

## Normative Rules

This RFC is not yet binding. It proposes that future versions define:

- the exact signing payload, aligned with `docs/CANONICALIZATION.md`
- Ed25519 key identity and scope identity rules
- key rotation and revocation metadata
- signature bundle format
- author identity and organization scope identity
- optional transparency-log integration
- offline verification requirements

## Compatibility Impact

v1.0 assets continue to use the existing `kdna.json.signature` field. Future
signature bundles MUST preserve the ability to verify v1.0 Ed25519 signatures.

## Conformance Requirements

TBD after at least two independent verifier implementations exist.

## Security Considerations

Signatures prove integrity and provenance. They do not prove expertise,
truthfulness, safety, or fitness for purpose.

## Open Questions

- Should KDNA support keyless signing through OIDC identities?
- Should transparency logs be required for official registry assets or optional?
- Should signature bundles live inside the asset, beside the asset, or both?
- How should private registries handle offline verification and private logs?
