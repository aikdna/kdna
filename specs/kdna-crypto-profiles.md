# KDNA Crypto Profiles

Status: **Active.** The `kdna.envelope.aead`
profile ID and its two KDF sub-profiles (`scrypt-sha256-v1` mandatory,
`argon2id-v1` optional compatibility KDF) are frozen; see RFC-0018 for the normative
contract. Predecessor profiles (`kdna.encryption.licensed-entry` from RFC-0008,
`kdna.encryption.password` from RFC-0009) remain in their own distinct
profile IDs and continue to be supported.
Normative: Yes after profile IDs and test vectors are frozen  
Related specs: `kdna-authorization-contract.md`, `kdna-secret-store.md`,
`kdna-import-security.md`, `RFC-0018-envelope-aead.md`

## 1. Scope

This spec defines encryption and signature profile boundaries for protected
KDNA assets. It does not define marketplace behavior, content quality,
entitlement business logic, or product UX.

## 2. Current Compatibility Profile

`kdna.encryption.licensed-entry` is the current CLI/Core MVP compatibility profile.

It derives an entry decrypt key from existing license activation material and
decrypts protected entries in memory. Implementations MAY support it for
migration and compatibility.

`kdna.encryption.password` is the password + recovery profile from
RFC-0009. It MAY be supported for compatibility with existing password-
protected assets. New product exports SHOULD NOT target it; use
`kdna.envelope.aead` instead.

New product-facing exports SHOULD converge on the canonical envelope profile
(RFC-0018) after the profile is frozen and test vectors exist. As of
2026-06-28 this convergence is recommended and feasible.

## 3. Canonical Envelope Profile — `kdna.envelope.aead`

**Accepted by RFC-0018.** Three test vectors are
published at `conformance/envelope-aead/` and the conformance
runner `conformance/envelope-aead.mjs` re-derives them.

Profile ID: `kdna.envelope.aead`

The canonical model is envelope encryption:

1. Generate a random content encryption key (`CEK`) per encrypted asset or entry
   set.
2. Encrypt payload entries with the `CEK` using `AES-256-GCM` and the
   profile-defined AAD (eight lines, joined by LF; see RFC-0018 R5).
3. Never store the raw `CEK` in the `.kdna` asset.
4. Store one or more key grants (`key_slots[]`) that wrap the `CEK` according
   to the entitlement profile.
5. The `CEK` is wrapped via `AES-256-KW` (RFC 3394) with a `KEK` derived from
   the slot's credential via a KDF selected by the slot's `kdf_profile`.

| Entitlement profile | CEK wrapping source |
|---|---|
| `password` | User passphrase derives a `KEK` via `scrypt-sha256-v1` (default) or `argon2id-v1` (opt-in). |
| `local_receipt` | Signed receipt carries or references wrapped CEK material. |
| `account` | Entitlement server returns a short-lived wrapped CEK. |
| `org` | Organization entitlement server returns a short-lived wrapped CEK. |
| `device_bound` | Receipt wraps CEK to a device public key. |
| `remote` | Client never receives the CEK. |

The full normative rules (envelope shape, KDF profile parameters, AAD
format, the profile non-collapse invariant, the Swift-port behaviour, error
codes) are in `rfcs/RFC-0018-envelope-aead.md`.

## 4. Password Profile

A short PIN MUST NOT be treated as the file encryption password.

For `kdna.envelope.aead`, the password slot's KDF is selected by
`kdf_profile`:

- `scrypt-sha256-v1` — mandatory, every conforming implementation MUST support
  it. N=32768, r=8, p=1, 16-byte salt, 32-byte KEK. Node.js's built-in
  `crypto.scryptSync` is sufficient.
- `argon2id-v1` — optional v2, Node.js implementations SHOULD support it.
  t=3, m=65536, p=4, 16-byte salt, 32-byte KEK. The Swift port does not
  have a native binding and follows RFC-0018 R6 (fallback to next slot
  or `KDNA_KDF_UNSUPPORTED`).

Chat MUST NOT log or persist passwords.

## 5. AEAD Baseline

Encrypted payload entries MUST use authenticated encryption. Decryption MUST
fail if ciphertext or associated metadata is modified.

For `kdna.envelope.aead`, the AEAD is frozen to `AES-256-GCM` with
12-byte IV, 16-byte tag, and the eight-line AAD format documented in
RFC-0018 R5.

Future AEADs (e.g. ChaCha20-Poly1305) require a new envelope profile ID.
The non-collapse invariant from RFC-0018 R4.3 forbids silent
cross-profile migration.

## 6. Associated Data

For `kdna.envelope.aead`, the AAD format is:

```
kdna.envelope.aead
0.1.0
<asset_uid>
<asset_id>
<asset_version>
<entry_path>
<access_mode>
<entitlement_profile>
```

See RFC-0018 R5 for the full contract. The final package digest cannot be an
input because it includes the encrypted entry and would create a digest cycle.
The AAD binds stable asset identity and release version; the signed delivery
or entitlement record binds the final package digest after packaging.

For other profile IDs (`kdna.encryption.licensed-entry`,
`kdna.encryption.password`), the AAD is the four-line format
defined in RFC-0008 / RFC-0009.

This prevents ciphertext swapping across assets, entries, manifests, and access
policies.

## 7. Downgrade Rules

Unknown crypto profiles MUST fail closed unless the user explicitly chooses a
legacy developer import path.

A runtime MUST reject an asset that attempts to downgrade from a stronger
declared profile to a weaker implementation path.

`kdna.encryption.licensed-entry`, `kdna.encryption.password`, and
`kdna.envelope.aead` MUST remain distinct profile IDs.

Within `kdna.envelope.aead`, the per-slot `kdf_profile` is also part
of the non-collapse rule: a reader that does not support the declared
`kdf_profile` MUST fail with `KDNA_KDF_UNSUPPORTED`. There is no
auto-downgrade path (RFC-0018 R4.3).

## 8. Test Vectors

`kdna.envelope.aead` test vectors are published at
`conformance/envelope-aead/`:

- `envelope-aead-vector-01-scrypt-basic.json` — scrypt-sha256-v1,
  single password slot, basic round-trip.
- `envelope-aead-vector-02-scrypt-multi-entry-aad.json` — two
  AADs over the same CEK + IV + plaintext; proves AAD binding via
  divergent tags.
- `envelope-aead-vector-03-argon2id-basic.json` — argon2id-v1,
  single password slot, basic round-trip.

A conformance runner at `conformance/envelope-aead.mjs`
re-derives each vector and asserts equality. Run with:

```bash
npm run conformance:envelope-aead
```

Test vector coverage (per RFC-0018 R9):

- password-derived key;
- CEK generation;
- CEK wrapping and unwrapping;
- AEAD encrypt/decrypt;
- AAD mismatch failure (vector 02);
- nonce uniqueness;
- tampered ciphertext;
- wrong password;
- unsupported profile fail-closed;
- JS Core and Swift Core parity (the current runner validates JS Core; Swift
  parity requires published shared-fixture evidence).
