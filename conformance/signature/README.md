# KDNA Signature Conformance Vectors — `kdsig.ed25519` (RFC-0021 M1)

This directory is the conformance artifact for the KDNA asset signature
profile `kdsig.ed25519`, the first milestone (M1, payload canonicalization)
of [RFC-0021](../../rfcs/RFC-0021-signature-track.md).

## Contents

- `vectors.json` — deterministic known-answer vectors:
  - the signer key (a public vector seed — never a real signing key),
  - the unsigned asset entries (hex-encoded),
  - the pinned canonical `content_digest`,
  - the pinned runtime `entry_set_digest` (kdna.json + payload.kdnab),
  - the pinned Ed25519 signing payload,
  - the pinned signature bundle and its canonical wire bytes,
  - negative cases that every conforming verifier MUST reject fail-closed,
  - the documented wrong-key (pinning) semantics.
- `run.mjs` — the JavaScript known-answer runner
  (`npm run conformance:signature`).

Container ZIP/DEFLATE bytes are deliberately **not** pinned: DEFLATE output
differs across compressors, zlib versions, and systems
([specs/container.md](../../specs/container.md)). The pinned anchors are the
deterministic logical coordinates (content digest, entry-set digest, signing
payload bytes, and Ed25519-deterministic bundle bytes); container-level
conformance is round-trip equivalence — unpack → repack preserves every
pinned digest and the signature still verifies through validate/plan/load.

## Wire contract (summary)

- Entry: one optional top-level `signature.kdsig` container entry.
- Bundle: a JSON object with exactly these string fields:
  `algorithm` (`ed25519`), `content_digest` (`sha256:<64 lowercase hex>`),
  `profile` (`kdsig.ed25519`), `profile_version` (`0.1.0`),
  `public_key` (32-byte raw key, 64 lowercase hex),
  `signature` (64-byte raw Ed25519 signature, 128 lowercase hex).
  Unknown fields, other profiles, or other versions are rejected.
- Signing payload: the UTF-8 bytes of
  `kdsig.ed25519:0.1.0:<content_digest>`, where `content_digest` is the
  asset content digest defined by
  [docs/CANONICALIZATION.md](../../docs/CANONICALIZATION.md) with
  `signature.kdsig` itself excluded from the entry set.
- Verification is offline and fail-closed: any malformed, unsupported, or
  unverifiable bundle rejects validation, LoadPlan, and loading.
- The bundle carries its own public key. A valid signature proves integrity
  and key-bound provenance only; trusting the key is the consumer's pinning
  decision (identity binding is future milestone work).

## Reproducing the vectors

```bash
node scripts/generate-signature-vectors.mjs --check   # verify committed file
node scripts/generate-signature-vectors.mjs           # regenerate (byte-stable)
node conformance/signature/run.mjs                    # run the JS known answers
```

Ed25519 and SHA-256 are deterministic, so regeneration is byte-identical on
every platform. Independent implementations (for example the Python SDK in
`python-sdk/`, tested by `python-sdk/tests/test_signature.py`) consume the
same `vectors.json`.

## Security note

The vector seed is public test material. It must never be reused for real
signing. A signature proves integrity and provenance; it never proves
expertise, truthfulness, safety, or fitness for purpose.
