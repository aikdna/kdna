# KDNA Crypto Profiles

Status: Draft  
Normative: Yes after profile IDs and test vectors are frozen  
Related specs: `kdna-authorization-contract.md`, `kdna-secret-store.md`,
`kdna-import-security.md`

## 1. Scope

This spec defines encryption and signature profile boundaries for protected
KDNA assets. It does not define marketplace behavior, content quality,
entitlement business logic, or product UX.

## 2. Current Compatibility Profile

`kdna-licensed-entry-v1` is the current CLI/Core MVP compatibility profile.

It derives an entry decrypt key from existing license activation material and
decrypts protected entries in memory. Implementations MAY support it for
migration and compatibility.

New product-facing exports SHOULD converge on the future canonical envelope
profile after the profile is frozen and test vectors exist.

## 3. Proposed Canonical Envelope Profile

Proposed profile ID: `kdna-envelope-aead-v1`

The canonical model is envelope encryption:

1. Generate a random content encryption key (`CEK`) per encrypted asset or entry
   set.
2. Encrypt payload entries with the `CEK`.
3. Never store the raw `CEK` in the `.kdna` asset.
4. Store one or more key grants that wrap the `CEK` according to the entitlement
   profile.

| Entitlement profile | CEK wrapping source |
|---|---|
| `password` | User passphrase derives a key-encryption key (`KEK`). |
| `local_receipt` | Signed receipt carries or references wrapped CEK material. |
| `account` | Entitlement server returns a short-lived wrapped CEK. |
| `org` | Organization entitlement server returns a short-lived wrapped CEK. |
| `device_bound` | Receipt wraps CEK to a device public key. |
| `remote` | Client never receives the CEK. |

## 4. Password Profile

A short PIN MUST NOT be treated as the file encryption password.

Password-derived keys SHOULD use a memory-hard KDF. Argon2id is preferred if the
cross-language dependency is accepted. Existing scrypt-sha256 behavior MUST be
marked compatibility or legacy unless explicitly selected for v1.

Baseline if Argon2id is accepted:

- salt: at least 128-bit random;
- output: 256-bit KEK;
- memory: 64 MiB minimum for ordinary devices;
- iterations: 3 or tuned equivalent;
- parallelism: tuned per platform.

Chat MUST NOT log or persist passwords.

## 5. AEAD Baseline

Encrypted payload entries MUST use authenticated encryption. Decryption MUST
fail if ciphertext or associated metadata is modified.

Candidate AEAD algorithms:

- AES-256-GCM;
- ChaCha20-Poly1305 where platform support requires it.

The final profile MUST freeze algorithm IDs, nonce sizes, nonce generation
rules, authentication tag sizes, and test vectors before product code depends
on it.

## 6. Associated Data

AAD SHOULD bind ciphertext to the asset context:

- asset UID;
- asset digest;
- content digest;
- manifest digest;
- entry path;
- format version;
- spec version;
- access mode;
- entitlement profile;
- encryption profile;
- algorithm ID.

This prevents ciphertext swapping across assets, entries, manifests, and access
policies.

## 7. Downgrade Rules

Unknown crypto profiles MUST fail closed unless the user explicitly chooses a
legacy developer import path.

A runtime MUST reject an asset that attempts to downgrade from a stronger
declared profile to a weaker implementation path.

`kdna-licensed-entry-v1` and `kdna-envelope-aead-v1` MUST remain distinct
profile IDs.

## 8. Test Vectors

Before this spec becomes final, the repo MUST include test vectors for:

- password-derived key;
- CEK generation;
- CEK wrapping and unwrapping;
- AEAD encrypt/decrypt;
- AAD mismatch failure;
- nonce uniqueness;
- tampered ciphertext;
- wrong password;
- unsupported profile fail-closed;
- JS Core and Swift Core parity.
