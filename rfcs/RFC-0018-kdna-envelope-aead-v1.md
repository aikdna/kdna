# RFC-0018: KDNA Canonical Envelope Profile — `kdna-envelope-aead-v1`

Status: **accepted**.

## Summary

This RFC freezes the **canonical envelope encryption profile**
`kdna-envelope-aead-v1` for KDNA assets. The profile is the
mandatory target for new product-facing exports and is the spec
that future implementations (Node.js, Swift, Rust, others) must
converge on.

The profile is a **true envelope encryption** scheme: a random
content encryption key (CEK) encrypts each protected entry; the
CEK is wrapped by one or more key slots derived from the
entitlement credential; the wrapped CEK is stored in the
envelope, never the raw CEK. The unwrap path lives in memory
only.

Two KDF profiles are supported under the same envelope ID, with
an explicit `kdf_profile` field on each key slot:

| `kdf_profile`        | KDF             | Implementations  | Required support |
|----------------------|-----------------|------------------|------------------|
| `scrypt-sha256-v1`   | scrypt-sha256   | Node.js, Swift   | **Mandatory**    |
| `argon2id-v1`       | Argon2id        | Node.js only     | Optional v2      |

The two profile IDs are **never collapsed**: a reader that does
not support the declared `kdf_profile` MUST fail closed (see
**Profile non-collapse invariant** below).

## Motivation

KDNA needs a single canonical envelope profile that:

- A new author can target without reading three predecessor
  RFCs.
- A future implementation (Node.js, Swift, Rust, Go, browser
  WebCrypto, etc.) can implement in one place and have a
  frozen test vector to verify against.
- Existing `kdna-licensed-entry-v1` (RFC-0008) and
  `kdna-password-protected-v1` (RFC-0009) assets keep working
  through their own profile IDs.

The protocol must support both:

- a **universal default** that works on every platform
  (scrypt-sha256-v1, available in Node.js's `crypto` and
  Apple's CommonCrypto),
- a **stronger opt-in** for creators who want Argon2id's
  memory-hardness guarantees (argon2id-v1, available in
  Node.js via `@noble/hashes/argon2.js` and in browsers via
  WASM).

Without a single canonical profile, every new release has to
re-litigate the AES mode, the KDF choice, the AAD format, and
the key slot shape. This RFC freezes all of them.

## Normative Rules

### R1 — Profile ID and declaration

Every envelope object MUST carry a `profile` field with the
literal string `kdna-envelope-aead-v1`. Any other value is
rejected with `KDNA_ENVELOPE_PROFILE_UNSUPPORTED`. The error
MUST name the unsupported value and the supported value.

### R2 — Envelope shape

The envelope is a JSON object with the following fields. All
fields are required unless marked optional.

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `profile`      | string | yes      | MUST be `kdna-envelope-aead-v1`. |
| `alg`          | string | yes      | MUST be `AES-256-GCM`. |
| `key_wrapping` | string | yes      | MUST be `AES-256-KW` (RFC 3394). |
| `kdf_profile`  | string | yes      | One of `scrypt-sha256-v1` or `argon2id-v1`. See R4. |
| `key_slots`    | array  | yes      | At least one entry. See R3. |
| `iv`           | string | yes      | Base64. 12 bytes (96-bit AES-GCM nonce). |
| `tag`          | string | yes      | Base64. 16 bytes (AES-GCM auth tag). |
| `ciphertext`   | string | yes      | Base64. Variable length. |

The canonical on-the-wire encoding is **CBOR** (RFC 8949,
deterministic encoding rules, length-first map ordering). JSON
is the human-readable presentation form used in test vectors
and developer tooling. The two forms MUST be byte-equivalent
under CBOR canonical encoding; any divergence is a profile
violation.

### R3 — Key slots

`key_slots[]` is an array of slot objects. Each slot describes
one way to unwrap the CEK. The CEK is wrapped once and the
same wrapped bytes are referenced by every slot.

Each slot has the shape:

```json
{
  "slot":        "<slot name, e.g. 'password' or 'recovery'>",
  "kdf_profile": "scrypt-sha256-v1" | "argon2id-v1",
  "kdf_params":  { ... KDF-specific parameters ... },
  "wrap":        "AES-256-KW",
  "wrapped_key": "<base64, 40 bytes>"
}
```

The first slot is the "primary" slot (e.g. the user-supplied
password). Additional slots are recovery / out-of-band
mechanisms. The CEK wrapped under each slot MUST be the same
CEK (a reader that successfully unwraps from any one slot
gets the same content key).

The `slot` field is an opaque string for human readability; the
contract is that the `kdf_profile` and `kdf_params` are what
the reader uses to derive the KEK.

### R4 — KDF profiles

`kdf_profile` is per-slot, not per-envelope. (The top-level
`kdf_profile` field on the envelope is the primary slot's
`kdf_profile` for convenience and is a redundant copy. Readers
MUST use the per-slot value.)

#### R4.1 — `scrypt-sha256-v1`

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | scrypt-sha256 | RFC 7914 |
| N         | 32768 | Cost parameter |
| r         | 8     | Block size |
| p         | 1     | Parallelization |
| Salt      | 16 bytes (128-bit) | Random per slot |
| Output    | 32 bytes (256-bit KEK) | — |

The `kdf_params` object MUST include `N`, `r`, `p`, and
`salt` (base64). Other fields are ignored.

**Mandatory support.** Every conforming implementation MUST
support `scrypt-sha256-v1`. This is the universal default and
the compatibility path. Node.js's built-in `crypto.scryptSync`
is sufficient.

#### R4.2 — `argon2id-v1`

| Parameter  | Value  | Description |
|------------|--------|-------------|
| Algorithm  | Argon2id | RFC 9106 |
| t (iter)   | 3      | Time cost |
| m (memory) | 65536  | 64 MiB |
| p (lanes)  | 4      | Parallelism |
| Salt       | 16 bytes (128-bit) | Random per slot |
| Output     | 32 bytes (256-bit KEK) | — |

The `kdf_params` object MUST include `t`, `m`, `p`, and
`salt` (base64). Other fields are ignored.

**Optional v2 support.** Implementations MAY support
`argon2id-v1`; those that do MUST verify that `m` is at least
64 MiB. The Swift port does not have a native Argon2id
binding and MUST follow R6.

#### R4.3 — Profile non-collapse invariant

A reader that does not support the declared `kdf_profile` MUST
fail with the typed error `KDNA_KDF_UNSUPPORTED` and the
human-readable name of the missing profile. There is no
"auto-downgrade" path. There is no "fall back to whatever is
supported" path.

This is the **single most important security rule** in the
profile. A reader that picks the strongest KDF it can locally
support lets an attacker craft the envelope to force the
weaker path. The `kdf_profile` field is a contract, not a
hint.

### R5 — AAD format

The Additional Authenticated Data for AES-256-GCM is the
UTF-8 encoding of six lines joined by `\n` (LF, U+000A):

```
kdna-envelope-aead-v1
<asset_uid>
<asset_digest>
<entry_path>
<access_mode>
<entitlement_profile>
```

| Line | Source |
|------|--------|
| 1    | Literal `kdna-envelope-aead-v1`. |
| 2    | `kdna.json.asset_uid`. |
| 3    | `kdna.json.digests.asset` (the asset-level digest, the value that binds the .kdna file as a whole). |
| 4    | The encrypted entry's path inside the .kdna container (e.g. `KDNA_Core.json`). |
| 5    | `kdna.json.access` (one of `public`, `licensed`, `remote`). |
| 6    | The active entitlement profile (e.g. `password`, `account`, `org`, `device_bound`, `local_receipt`, `purchase_receipt`, `remote`). |

`asset_uid`, `asset_digest`, `entry_path`, and
`entitlement_profile` are part of the AAD so that:

- A ciphertext cannot be moved across entries in the same
  asset (the tag would not verify against the new path's
  AAD).
- A ciphertext cannot be moved across assets (the asset_uid
  and asset_digest would differ).
- A ciphertext cannot be moved across access modes or
  entitlement profiles (the tag would not verify).

The conformance test **vector 02** explicitly proves this:
two envelopes with the same CEK + IV + plaintext but
different `entry_path` AADs produce the same ciphertext (GCM
property) but **different tags** (AAD binding). A reader
that decrypts entry 2's ciphertext using entry 1's AAD MUST
fail the GCM authentication check.

### R6 — Swift port behaviour

The KDNA Swift port (no native Argon2id binding) MUST:

- (a) Support `scrypt-sha256-v1` for every envelope (mandatory
  per R4.1).
- (b) On encountering a slot with `kdf_profile:
  "argon2id-v1"`, EITHER:
  - Fall back to the next slot in `key_slots[]` if any other
    slot's `kdf_profile` is `scrypt-sha256-v1`, OR
  - Fail with `KDNA_KDF_UNSUPPORTED` and a human-readable
    reason: "this Swift build does not implement Argon2id;
    supply a password-slot scrypt-sha256-v1 envelope or
    install the Argon2id extension build".
- (c) NEVER silently accept the envelope under a weaker KDF
  than declared. The per-slot `kdf_profile` is the contract.

The implementation picks between (b.i) and (b.ii) at build
time. Both are valid; neither is silent. The choice is
documented in the Swift port's release notes.

### R7 — IV, tag, ciphertext sizes

| Field       | Size (decoded) | Notes |
|-------------|----------------|-------|
| `iv`        | 12 bytes       | 96-bit AES-GCM nonce. MUST be unique per (CEK, slot) pair. The same CEK used twice on the same asset MUST use two different IVs. |
| `tag`       | 16 bytes       | AES-GCM authentication tag. |
| `ciphertext`| variable       | Plaintext length, no padding (GCM is a stream cipher). |
| `wrapped_key` | 40 bytes     | AES-256-KW output for a 32-byte CEK. Same across all slots. |

A reader that sees an `iv` of any length other than 12 bytes
or a `tag` of any length other than 16 bytes MUST fail with
`KDNA_ENVELOPE_FIELD_LENGTH` naming the offending field.

### R8 — Memory-only rule

Decrypted plaintext MUST remain in volatile memory only. A
reader MUST NOT write decrypted entries to persistent disk,
logs, traces, or audit events. The error conditions in R10
are the only signals a reader may emit on failure.

### R9 — Test vector conformance

Every conforming implementation MUST be able to decrypt
**all three** test vectors in `conformance/kdna-envelope-aead-v1/`
without modification. The vectors are:

- `kdna-envelope-aead-v1-vector-01-scrypt-basic.json` —
  scrypt-sha256-v1, single password slot, basic round-trip.
- `kdna-envelope-aead-v1-vector-02-scrypt-multi-entry-aad.json` —
  scrypt-sha256-v1, two AADs (different `entry_path`) over
  the same CEK + IV + plaintext, proving AAD binding via
  divergent tags.
- `kdna-envelope-aead-v1-vector-03-argon2id-basic.json` —
  argon2id-v1, single password slot, basic round-trip.

A conformance runner at `conformance/kdna-envelope-aead-v1.mjs`
re-derives each vector's expected outputs from the declared
inputs and asserts equality. Run with:

```bash
npm run conformance:envelope-aead
```

The conformance runner is the canonical "is this
implementation correct?" check. New implementations can also
run it as a pre-merge CI gate.

### R10 — Error conditions

Implementations MUST reject with a distinct error when:

| Condition | Error code |
|-----------|------------|
| `profile` is not `kdna-envelope-aead-v1`. | `KDNA_ENVELOPE_PROFILE_UNSUPPORTED` |
| `alg` is not `AES-256-GCM`. | `KDNA_ENVELOPE_ALG_UNSUPPORTED` |
| `key_wrapping` is not `AES-256-KW`. | `KDNA_ENVELOPE_WRAP_UNSUPPORTED` |
| `key_slots[]` is empty. | `KDNA_ENVELOPE_NO_SLOTS` |
| `iv` is not 12 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`iv`) |
| `tag` is not 16 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`tag`) |
| `wrapped_key` is not 40 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`wrapped_key`) |
| `kdf_profile` is one this reader does not support and no other slot offers a supported KDF. | `KDNA_KDF_UNSUPPORTED` |
| AES-256-KW unwrap fails (integrity). | `KDNA_KW_INTEGRITY` |
| AES-GCM authentication fails (wrong key, wrong AAD, tampered ciphertext). | `KDNA_GCM_AUTH_FAILED` |
| `kdf_params` is missing a required parameter for the declared `kdf_profile`. | `KDNA_KDF_PARAMS_INVALID` |

Each error code MUST be emitted at most once per decryption
attempt. Implementations MUST NOT log the CEK, KEK, plaintext,
or any of these error contexts at `info` or higher; failure
detail is emitted at `debug` only.

## Compatibility Impact

| Profile ID | Status under RFC-0018 |
|------------|------------------------|
| `kdna-licensed-entry-v1` (RFC-0008) | Unchanged. Continues to be the compat path. Distinct ID; no silent migration. |
| `kdna-password-protected-v1` (RFC-0009) | Unchanged. Continues to be the password + recovery path. Distinct ID; no silent migration. |
| `kdna-envelope-aead-v1` (this RFC) | **New canonical envelope profile.** Future product exports should target this. |
| `kdna-licensed-entry-experimental` (legacy) | Unchanged. Remains read-only legacy. |

The four profile IDs MUST stay distinct in the registry, the
SDK enum, and the CLI's `--profile` argument. A reader that
sees an unrecognized profile ID MUST fail closed (R1, R4.3).

## Conformance Requirements

A conforming implementation MUST:

1. Implement R1 through R10 above.
2. Pass all three test vectors (R9).
3. Emit the error codes named in R10 (or a strict superset
   with the same names).
4. Document which `kdf_profile` values it supports.
5. For Swift: pick (b.i) or (b.ii) in R6 and document the
   choice.

A conforming implementation SHOULD:

1. Support both `kdf_profile` values.
2. Use CBOR canonical encoding for the on-the-wire form.
3. Run `conformance:envelope-aead` as a pre-merge CI gate.

## Security Considerations

- **The `kdf_profile` field is security-critical.** A reader
  that treats it as a hint rather than a contract is broken.
  See R4.3.
- **AAD binding prevents ciphertext migration.** Moving a
  ciphertext across entries, assets, or access modes causes
  AES-GCM auth failure. Vector 02 demonstrates this.
- **The KDF params are not the KDF itself.** A reader that
  trusts `kdf_params` without verifying that the
  implementation supports the claimed `m` (memory cost) can
  be DoS'd by a 4 GiB memory request. The Swift port and
  the WASM build in particular MUST bound `m` and `t` at
  load time.
- **Salt uniqueness is not sufficient for nonce uniqueness.**
  GCM nonce reuse with the same key is catastrophic. R7
  requires per-(CEK, slot) IV uniqueness. Implementations
  MUST track IVs used per CEK and reject on collision.
- **Scrypt parameters are the universal default.** N=32768,
  r=8, p=1 is the lowest setting the Node.js implementation
  accepts without a `maxmem` override. Future profile
  revisions may raise this; the change requires a new
  `kdf_profile` value (e.g. `scrypt-sha256-v2`) and the
  non-collapse invariant still applies.

## Open Questions

- Whether AES-256-GCM should be paired with ChaCha20-Poly1305
  in a future v2 of the envelope profile. The current answer
  is "no — one AEAD per profile freeze; new AEADs get a new
  profile ID". This is the same non-collapse shape.
- Whether `kdf_profile` should ever be inferred from the
  presence of `scrypt_params` / `argon2_params` (today the
  fields are independent). The current answer is "no — explicit
  `kdf_profile` is the contract". A future profile revision
  could relax this if the ergonomics get in the way.
- The envelope object is represented by the profile fields defined here. In
  the current KDNA Asset Container, `payload.kdnab` is CBOR and an encrypted
  envelope stored in that entry is CBOR-encoded. Implementations MUST NOT use a
  JSON fallback for that container entry. Conformance vectors may express
  expected object fields in JSON for readability; that does not change the
  container wire encoding.
