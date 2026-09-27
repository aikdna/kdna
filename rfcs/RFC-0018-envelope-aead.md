# RFC-0018: KDNA Canonical Envelope Profile — `kdna.envelope.aead`

Status: **draft — pre-release candidate**. Contract clarification: **2026-09-20**.

This revision corrects conflicting multi-slot and optional-KDF requirements,
and aligns parameter validation with the fixed R4 tables. It changes the draft
acceptance set; it is not a compatible replacement of an already released
profile or consumer. See [revision impact](#revision-impact-2026-09-20) and
[protection adoption](../specs/protection-adoption.md).

This document is the candidate for KDNA's first public envelope wire contract;
it has not yet been published as a stable compatibility promise. Repository
fixtures and implementation bytes produced before that publication are
pre-release evidence, not public compatibility coordinates.

## Summary

This RFC defines the pre-release candidate for the **canonical envelope
encryption profile** `kdna.envelope.aead` for KDNA assets. It is the intended
target for new product-facing exports and the contract that implementations
(Node.js, Swift, Rust, others) are expected to converge on before the first
stable publication.

The KDF tokens remain unversioned: `scrypt-sha256` and `argon2id`. Wire
evolution is represented separately by `profile_version`, whose first public
candidate is `0.1.0`. No alternate generation-suffixed KDF token or
compatibility shim is part of this candidate.

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
| `scrypt-sha256`   | scrypt-sha256   | Every conforming build | **Mandatory**    |
| `argon2id`       | Argon2id        | Builds declaring this capability | Optional profile |

The two profile IDs are **never collapsed**: a reader that does
not support the selected slot's declared `kdf_profile` MUST fail closed (see
**Profile non-collapse invariant** below).

## Motivation

KDNA needs a single canonical envelope profile that:

- A new author can target without reading three predecessor
  RFCs.
- A future implementation (Node.js, Swift, Rust, Go, browser
  WebCrypto, etc.) can implement in one place and have a
  deterministic candidate test vector to verify against.
- Existing `kdna.encryption.licensed-entry` (RFC-0008) and
  `kdna.encryption.password` (RFC-0009) assets keep working
  through their own profile IDs.

The protocol must support both:

- a **universal default** that works on every platform
  (scrypt-sha256, available in Node.js's `crypto` and
  Apple's CommonCrypto),
- a **stronger opt-in** for creators who want Argon2id's
  memory-hardness guarantees (argon2id, available in
  Node.js via `@noble/hashes/argon2.js` and in browsers via
  WASM).

Without a single canonical profile, every new release has to
re-litigate the AES mode, the KDF choice, the AAD format, and
the key slot shape. This candidate fixes all of them for pre-release
conformance; stable compatibility begins only when the profile is published.

## Normative Rules

### R1 — Profile ID and declaration

Every envelope object MUST carry a `profile` field with the literal string
`kdna.envelope.aead` and a `profile_version` field with the literal string
`0.1.0`. Any other profile value is rejected with
`KDNA_ENVELOPE_PROFILE_UNSUPPORTED`; any other profile version is rejected
with `KDNA_ENVELOPE_VERSION_UNSUPPORTED`. The error MUST name the unsupported
value and the supported value.

### R2 — Envelope shape

The envelope is a JSON object with the following fields. All
fields are required unless marked optional.

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `profile`      | string | yes      | MUST be `kdna.envelope.aead`. |
| `profile_version` | string | yes   | MUST be `0.1.0`; this coordinate evolves independently from KDF tokens. |
| `alg`          | string | yes      | MUST be `AES-256-GCM`. |
| `key_wrapping` | string | yes      | MUST be `AES-256-KW` (RFC 3394). |
| `kdf_profile`  | string | yes      | One of `scrypt-sha256` or `argon2id`. See R4. |
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
one way to unwrap the same CEK. Each slot independently wraps that CEK with
its own derived KEK. Different KEKs normally produce different `wrapped_key`
bytes; copying one slot's wrapped bytes to a slot with a different KEK is invalid.

Each slot has the shape:

```json
{
  "slot":        "<slot name, e.g. 'password' or 'recovery'>",
  "kdf_profile": "scrypt-sha256" | "argon2id",
  "kdf_params":  { ... KDF-specific parameters ... },
  "wrap":        "AES-256-KW",
  "wrapped_key": "<base64, 40 bytes>"
}
```

The first slot is the "primary" slot (e.g. the user-supplied
password). Additional slots are recovery / out-of-band
mechanisms. The CEK wrapped under each slot MUST be the same
CEK (a reader that successfully unwraps from any one slot
gets the same content key). Producers MUST ensure this invariant; a reader
with only one credential cannot prove equality with inaccessible slots.
Successful unwrap is not success until GCM authentication also succeeds.

Readers default to the primary slot. An explicit slot selection MAY choose
another declared slot; selection MUST identify its array index to the caller.
An unsupported or failed selected slot MUST reject that attempt, without
silently trying other credentials, slots, or KDFs. An application may make a
separate explicit attempt at another slot. Slot labels do not grant authority.

The `slot` field is an opaque string for human readability; the
contract is that the `kdf_profile` and `kdf_params` are what
the reader uses to derive the KEK.

### R4 — KDF profiles

`kdf_profile` is per-slot, not per-envelope. (The top-level
`kdf_profile` field on the envelope is the primary slot's
`kdf_profile` for convenience and is a redundant copy. Readers
MUST use the per-slot value and reject a mismatching top-level copy with
`KDNA_ENVELOPE_KDF_MISMATCH`.)

#### R4.1 — `scrypt-sha256`

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | scrypt-sha256 | RFC 7914 |
| N         | 32768 | Cost parameter |
| r         | 8     | Block size |
| p         | 1     | Parallelization |
| Salt      | 16 bytes (128-bit) | Random per slot |
| Output    | 32 bytes (256-bit KEK) | — |

The `kdf_params` object MUST include `N`, `r`, `p`, and
`salt` (base64). The numeric values in this table are exact for this draft
coordinate; other values and unknown parameter fields MUST be rejected with
`KDNA_KDF_PARAMS_INVALID` before invoking the KDF.

**Mandatory support.** Every conforming implementation MUST
support `scrypt-sha256`. This is the universal default and
the compatibility path. Node.js's built-in `crypto.scryptSync`
is sufficient.

#### R4.2 — `argon2id`

| Parameter  | Value  | Description |
|------------|--------|-------------|
| Algorithm  | Argon2id | RFC 9106 |
| t (iter)   | 3      | Time cost |
| m (memory) | 65536  | 64 MiB |
| p (lanes)  | 4      | Parallelism |
| Salt       | 16 bytes (128-bit) | Random per slot |
| Output     | 32 bytes (256-bit KEK) | — |

The `kdf_params` object MUST include `t`, `m`, `p`, `dkLen: 32`, and
`salt` (base64). The numeric values in this table are exact for this draft
coordinate; other values and unknown parameter fields MUST be rejected with
`KDNA_KDF_PARAMS_INVALID` before invoking the KDF.

**Optional Argon2id support.** Implementations MAY support
`argon2id`; those that do MUST enforce these exact parameters, including
`m: 65536` KiB. Builds without an Argon2id binding follow R6.

The schema `$defs/scrypt_params` and `$defs/argon2_params` encode these fixed
parameter sets, not a future tuning range. Salt is exactly 16 decoded bytes. All envelope and KDF base64 fields MUST
use canonical padded RFC 4648 encoding; ciphertext may be empty for empty
plaintext. Schema patterns constrain the representation, while consumers
also check decoded lengths and canonical round-trip encoding. Implementations MUST
validate shape, parameter/KDF pairing and limits before allocating KDF
resources. Higher costs or different output lengths require a separately
reviewed profile revision; they cannot be inferred from schema-only ranges.

#### R4.3 — Profile non-collapse invariant

A reader that does not support the selected slot's declared `kdf_profile` MUST
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
UTF-8 encoding of eight lines joined by `\n` (LF, U+000A):

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

| Line | Source |
|------|--------|
| 1    | Literal `kdna.envelope.aead`. |
| 2    | Stable envelope profile version, literal `0.1.0`. |
| 3    | `kdna.json.asset_uid`. |
| 4    | `kdna.json.asset_id`. |
| 5    | `kdna.json.version`. |
| 6    | The encrypted entry's path inside the `.kdna` container (normally `payload.kdnab`). |
| 7    | `kdna.json.access` (one of `public`, `licensed`, `remote`). |
| 8    | The active entitlement profile (for example `password`, `account`, or `org`). |

`asset_uid`, `asset_id`, `asset_version`, `entry_path`, and
`entitlement_profile` are part of the AAD so that:

- A ciphertext cannot be moved across entries in the same
  asset (the tag would not verify against the new path's
  AAD).
- A ciphertext cannot be moved across assets or asset releases (the UID,
  identifier, or release version would differ).
- A ciphertext cannot be moved across access modes or
  entitlement profiles (the tag would not verify).

The conformance test **vector 02** explicitly proves this:
two envelopes with the same CEK + IV + plaintext but
different `entry_path` AADs produce the same ciphertext (GCM
property) but **different tags** (AAD binding). A reader
that decrypts entry 2's ciphertext using entry 1's AAD MUST
fail the GCM authentication check.

### R6 — Builds without Argon2id (including Swift builds without a binding)

Every conforming build MUST support `scrypt-sha256`. A build MAY omit
`argon2id`, but MUST declare that capability and return `KDNA_KDF_UNSUPPORTED`
for an attempt selecting an Argon2id slot. A single Argon2id slot is therefore
an expected rejection for that build, not a successful decryption or a skip.

An application MAY explicitly select a different, already-declared scrypt
slot under R3. This is a separate attempt at that slot, not reinterpretation
of the Argon2id slot as scrypt. The reader MUST report the selected index and
KDF; it MUST NOT automatically select a weaker slot after an unsupported KDF,
wrong password, failed unwrap, or failed authentication. Builds document this
selection policy and their supported KDFs. Language names alone do not prove
support: each actual build must supply its own implementation evidence.

### R7 — IV, tag, ciphertext sizes

| Field       | Size (decoded) | Notes |
|-------------|----------------|-------|
| `iv`        | 12 bytes       | 96-bit AES-GCM nonce. MUST be unique per CEK across all entries; adding slots does not change the nonce domain. The same CEK used twice on the same asset MUST use two different IVs. |
| `tag`       | 16 bytes       | AES-GCM authentication tag. |
| `ciphertext`| variable       | Plaintext length, no padding (GCM is a stream cipher). |
| `wrapped_key` | 40 bytes     | AES-256-KW output for a 32-byte CEK. Each slot wraps the same CEK with that slot's KEK; wrapped bytes need not match. |

A reader that sees an `iv` of any length other than 12 bytes
or a `tag` of any length other than 16 bytes MUST fail with
`KDNA_ENVELOPE_FIELD_LENGTH` naming the offending field.

### R8 — Memory-only rule

Decrypted plaintext MUST remain in volatile memory only. A
reader MUST NOT write decrypted entries to persistent disk,
logs, traces, or audit events. The error conditions in R10
are the only signals a reader may emit on failure.

### R9 — Test vector conformance

**Base conformance** requires scrypt decryption, explicit rejection of
unsupported selected KDFs, multi-slot and tamper checks, and shape/parameter
validation. **Optional Argon2id capability** additionally requires actual
Argon2id decryption. A skipped or unexecuted algorithm is never a decryption
pass. The frozen vectors in `conformance/envelope-aead/` are:

- `envelope-aead-vector-01-scrypt-basic.json` —
  scrypt-sha256, single password slot, basic round-trip.
- `envelope-aead-vector-02-scrypt-multi-entry-aad.json` —
  scrypt-sha256, two AADs (different `entry_path`) over
  the same CEK + IV + plaintext, proving AAD binding via
  divergent tags.
- `envelope-aead-vector-03-argon2id-basic.json` —
  argon2id, single password slot: decrypt if supported; otherwise reject with
  `KDNA_KDF_UNSUPPORTED`.
- `envelope-aead-vector-04-scrypt-multi-slot.json` — two distinct scrypt KEKs
  independently wrap the same CEK; both slots must decrypt the same plaintext.
- `envelope-aead-vector-05-mixed-multi-slot.json` — Argon2id primary and scrypt
  secondary; unsupported primary rejects even when another slot is available;
  explicit selection of the secondary must decrypt. Argon2id-capable builds
  must also decrypt the primary to the same CEK/plaintext.

A conformance runner at `conformance/envelope-aead.mjs`
re-derives each vector's expected outputs from the declared
inputs and asserts equality. Run with:

```bash
npm run conformance:envelope-aead
node conformance/envelope-aead.mjs --argon2id=disabled
node conformance/envelope-aead.mjs --argon2id=required
node --test conformance/envelope-aead.test.mjs
```

The runner checks its **local Node algorithm implementation**, not Core's
canonical consumer, CBOR/container admission, a platform port, a service, or
full R1–R10 product conformance. Default `auto` detects the installed optional
dependency. `disabled` exercises the named unsupported path; `required` fails
if the dependency is unavailable. Results distinguish `DECRYPTED`,
`REJECTED_EXPECTED`, and unexecuted work; schema validation is separate.
A claimed optional capability must execute its vectors, never convert
`SKIPPED`/`NOT_RUN` into a pass. Implementations must run the inputs through
their own consumer before claiming that consumer conforms.

Vectors 01–03 retain their original bytes and historical entry names. Vector
02 deliberately reuses a CEK/IV only to isolate AAD's effect; it is an
algorithm experiment, not an allowed production pair under R7. No vector
proves random generation, nonce tracking, memory erasure or platform parity.
The new vector generation method and independent expected-output route are
recorded in `conformance/envelope-aead/README.md`.

### R10 — Error conditions

Implementations MUST reject with a distinct error when:

| Condition | Error code |
|-----------|------------|
| `profile` is not `kdna.envelope.aead`. | `KDNA_ENVELOPE_PROFILE_UNSUPPORTED` |
| `profile_version` is not `0.1.0`. | `KDNA_ENVELOPE_VERSION_UNSUPPORTED` |
| Top-level `kdf_profile` differs from the primary slot. | `KDNA_ENVELOPE_KDF_MISMATCH` |
| `alg` is not `AES-256-GCM`. | `KDNA_ENVELOPE_ALG_UNSUPPORTED` |
| `key_wrapping` is not `AES-256-KW`. | `KDNA_ENVELOPE_WRAP_UNSUPPORTED` |
| Other invalid envelope shape or unknown envelope/slot fields. | `KDNA_ENVELOPE_SHAPE_INVALID` |
| `key_slots[]` is empty or the selected index does not exist. | `KDNA_ENVELOPE_NO_SLOTS` |
| `iv` is not 12 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`iv`) |
| `tag` is not 16 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`tag`) |
| `wrapped_key` is not 40 bytes after base64 decoding. | `KDNA_ENVELOPE_FIELD_LENGTH` (field=`wrapped_key`) |
| Selected slot's `kdf_profile` is not supported by this build (regardless of other slots). | `KDNA_KDF_UNSUPPORTED` |
| AES-256-KW unwrap fails (integrity). | `KDNA_KW_INTEGRITY` |
| AES-GCM authentication fails (wrong key, wrong AAD, tampered ciphertext). | `KDNA_GCM_AUTH_FAILED` |
| `kdf_params` is missing, extra, mismatched to its KDF, outside the exact R4 values, or has an invalid salt. | `KDNA_KDF_PARAMS_INVALID` |

Each error code MUST be emitted at most once per decryption
attempt. Implementations MUST NOT log the CEK, KEK, plaintext,
or any of these error contexts at `info` or higher; failure
detail is emitted at `debug` only.

## Compatibility Impact

| Profile ID | Status under RFC-0018 |
|------------|------------------------|
| `kdna.encryption.licensed-entry` (RFC-0008) | Unchanged. Continues to be the compat path. Distinct ID; no silent migration. |
| `kdna.encryption.password` (RFC-0009) | Unchanged. Continues to be the password + recovery path. Distinct ID; no silent migration. |
| `kdna.envelope.aead` (this RFC) | **New canonical envelope profile.** Future product exports should target this. |
| `kdna-licensed-entry-experimental` (legacy) | Unchanged. Remains read-only legacy. |

The four profile IDs MUST stay distinct in the registry, the
SDK enum, and the CLI's `--profile` argument. A reader that
sees an unrecognized profile ID MUST fail closed (R1, R4.3).

## Conformance Requirements

A conforming implementation MUST:

1. Implement R1 through R10 above.
2. Pass the base requirements and the vector outcomes for its declared optional
   capabilities (R9); unexecuted decryption is never counted as passed.
3. Emit the error codes named in R10 (or a strict superset
   with the same names).
4. Document which `kdf_profile` values it supports.
5. Document the explicit slot-selection policy in R3/R6 for every build.

A conforming implementation SHOULD:

1. Support both `kdf_profile` values.
2. Provide independent consumer evidence for the mandatory CBOR wire encoding
   required by R2.
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
  requires IV uniqueness across all encryptions with a CEK. Implementations
  MUST track IVs used per CEK and reject on collision.
- **Scrypt parameters are the universal default.** N=32768,
  r=8, p=1 is the exact current setting. Node implementations may need an
  explicit memory budget above the KDF working set. Parameter changes require
  a reviewed profile revision under the compatibility policy, not an invented
  KDF alias or silent adjustment.

## Open Questions

- Whether AES-256-GCM should be paired with ChaCha20-Poly1305
  in a future envelope profile. The current answer
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

## Revision impact — 2026-09-20

This draft correction resolves conflicting requirements, not an established
released-implementation vulnerability. The old password source already wraps
the same CEK separately for password and recovery. It is a distinct profile
and is not changed by this revision.

The former schema admitted ranges (for example scrypt N=16384 and Argon2id
m>65536) that conflicted with R4's fixed tables, and admitted parameter objects
for the wrong KDF. This revision selects the fixed tables, rejects those
schema-only values, requires the existing vector's `dkLen: 32`, and rejects
unknown parameter fields. The former prose said to ignore extra fields while
the schema rejected them. Consumers accepting those values need an explicit
adoption review; this is an acceptance-set change, not byte-compatible cleanup.
Canonical base64/decoded-length validation now rejects malformed presentations;
empty ciphertext is accepted to match R7's variable-length GCM contract.
Likewise, explicit slot selection replaces the contradictory automatic
fallback language; prior auto-selecting consumers must adapt deliberately.

The `0.1.0` coordinate remains an unpublished draft candidate. Adoption must
pin the revised source/vector fingerprint and this dated revision, retain
prior draft evidence, and compare actual consumers. Existing published
coordinates, predecessor profiles and old vectors are not overwritten or
silently reinterpreted. If an adopted public/stable contract or deployed
consumer is found to rely on the conflicting meaning, promotion is blocked
until its compatibility impact is resolved under the public version policy;
this draft edit does not authorize replacing that artifact under its old ID.
