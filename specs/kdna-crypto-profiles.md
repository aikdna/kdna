# KDNA Crypto Profiles

Status: **Pre-release candidate and compatibility map.** RFC-0018 and RFC-0019
retain their Draft status. Their presence in the specification index is not a
stable-publication or current-consumer claim. Predecessor profiles
`kdna.encryption.licensed-entry` and `kdna.encryption.password` retain their
distinct IDs and existing support commitments; this revision does not deprecate
or remove them. Support in an individual implementation must be stated for its
exact line. Current R2 ordinary root/browser admission rejects encrypted, signed, and
checksums-bearing containers. Explicit Node protection has separate inputs and
trusted-provider requirements; see [Protection adoption](protection-adoption.md).

The rules below govern implementations claiming the corresponding candidate
profile. They do not make every listed profile available through every runtime.
Related contracts: [authorization](kdna-authorization-contract.md),
[SecretStore](kdna-secret-store.md), [import security](kdna-import-security.md),
[RFC-0018](../rfcs/RFC-0018-envelope-aead.md),
[RFC-0019](../rfcs/RFC-0019-account-device-external-key-grant.md).

## 1. Scope

This document identifies encryption and signature boundaries for protected
KDNA assets. It does not define marketplace behavior, content quality,
entitlement business logic, or product UX. License terms, key possession,
verified entitlement, permission to disclose content, and permission to execute
an action are distinct; none automatically grants the others.

## 2. Distinct profiles and retained compatibility

| Profile / coordinate | Contract and retained implementation | Adoption boundary |
|---|---|---|
| `kdna.encryption.licensed-entry` / `profile_version: 0.1.0` | RFC-0008 compatibility identity; retained Core helper derives a wrapping key from license material using HKDF-SHA256, wraps a CEK and uses AES-256-GCM | Existing support commitments remain; not a canonical-envelope alias or current R2 admission capability |
| `kdna.encryption.password` / `profile_version: 0.1.0` | RFC-0009 predecessor identity; retained helper uses Argon2id plus independent password/recovery wrapping of one CEK | Keep the original profile, parameters and bytes; not an RFC-0018 slot representation |
| `kdna.encryption.password.scrypt` / `profile_version: 0.1.0` | Separate retained Core compatibility helper with its own envelope shape and scrypt parameters | Not an alias for either password or canonical envelope; this inventory adds no stable-publication claim |
| `kdna.envelope.aead` / `profile_version: 0.1.0` | RFC-0018 Draft; random CEK, per-slot declared KDF, AES-256-KW and AES-256-GCM | Candidate target for new password-envelope integrations, subject to explicit consumer conformance |
| `kdna.envelope.external-grant` + `kdna.grant.external-key` / `contract_version: 0.1.0` | RFC-0019 Draft; derived CEK, external signed account/device grant and X25519/HKDF/AES-KW device wrapping | Separate account/org contract; no CEK or wrapped CEK in the asset, no password-slot fallback |
| `kdsig.ed25519` / `profile_version: 0.1.0` | RFC-0021 M1 pre-release signature bundle, `signature.kdsig` | Integrity/provenance evidence only; not entitlement or judgment correctness. Historical grammar.3 ordinary admission was unavailable; current R2 ordinary admission still refuses signed containers, while explicit Node protection follows its separate contract |

New product-facing password exports SHOULD converge on RFC-0018 after the
chosen implementation explicitly adopts it. The predecessor support commitment
is not revoked by that direction, and a tool MUST NOT merely rename an old
profile or change manifest labels to claim adoption. Account/org key grants
follow RFC-0019 instead. Old RFC bodies that are marked superseded do not
restore their historical access modes or public command surface.

## 3. Canonical envelope candidate — `kdna.envelope.aead`

1. Generate a random 32-byte CEK for the encrypted entry or entry set.
2. Encrypt each entry with AES-256-GCM and the profile-defined AAD. Preserve
   RFC-0018 nonce-uniqueness requirements when a CEK protects multiple entries.
3. Never store the raw CEK in the `.kdna` asset.
4. Store one or more `key_slots[]`. Each slot derives its own KEK from its
   credential and declared KDF and separately wraps the same CEK using
   AES-256-KW. Different KEKs do not imply identical wrapped bytes.
5. Select and verify a declared slot under RFC-0018 R3/R6. A successful unwrap
   must still authenticate the encrypted entry; it is not plaintext admission.

RFC-0018 defines concrete scrypt/Argon2id credential-derived slots. A name such
as `local_receipt`, `account`, `org`, `device_bound`, or `remote` is not by itself
a defined RFC-0018 slot credential or proof of authorization. Account/org use
the distinct RFC-0019 profile. Receipt/device integrations need their own
explicit binding contract and consumer evidence; remote reading need not
distribute a CEK to the client. The access-mode taxonomy does not create any
of these capabilities automatically.

## 4. KDF capability and selected-slot behavior

A short PIN MUST NOT be treated as the file encryption password. Chat MUST NOT
log or persist passwords.

For RFC-0018, `kdf_profile` belongs to each slot. The envelope's top-level
copy describes the primary slot; it does not override another selected slot.

- `scrypt-sha256` is mandatory for base conformance: N=32768, r=8, p=1,
  16-byte salt, 32-byte output.
- `argon2id` is optional: t=3, m=65536 KiB, p=4, 16-byte salt,
  32-byte output. An implementation declaring support must actually derive,
  unwrap and authenticate its Argon2id cases; library presence alone is not
  successful decryption.

RFC-0018 R4 and the [envelope schema](envelope-aead.schema.json) define the
complete accepted parameter set. Base conformance includes the named
`KDNA_KDF_UNSUPPORTED` result for a valid selected Argon2id slot when that
capability is disabled or unavailable. `SKIPPED` is not that rejection and is
not a decryption pass. A dependency load failure must not silently demote a
claimed Argon2id capability.

The default is the primary slot. A caller may explicitly select another
authored slot and provide its matching credential. Implementations MUST NOT
retry another slot automatically after an unsupported KDF, wrong credential,
unwrap failure or authentication failure. Selecting an already-authored scrypt
slot explicitly does not rewrite an Argon2id slot or its parameters.

## 5. AEAD and authenticated bindings

Encrypted entries MUST use authenticated encryption. A modified ciphertext,
authentication tag or authenticated metadata must not produce usable plaintext.
RFC-0018 fixes AES-256-GCM, a 12-byte IV, a 16-byte tag and this exact eight-line
UTF-8 AAD, joined with LF and no trailing newline:

```text
kdna.envelope.aead
0.1.0
<asset_uid>
<asset_id>
<asset_version>
<entry_path>
<access_mode>
<entitlement_profile>
```

The final container digest A cannot appear in that AAD because it includes the
encrypted entry and creates a digest cycle. An authenticated delivery or grant
record binds A after packaging where that delivery contract requires it.
RFC-0019 has its own eleven-line AAD and signed grant binding; it is not this
eight-line format. Future RFC-0018 AEADs require a new envelope profile ID.

The retained predecessor Core helper's `encryptedEntryAad` uses **five**
LF-joined lines: profile, profile version, asset ID, asset version and entry
name. Historical superseded RFC-0008/0009 bodies describe four lines, using
`manifest.name` instead of asset ID and omitting the profile version. Those bytes differ and MUST NOT be treated as an automatic
compatibility path. This map describes the retained helper as it exists; it
does not rewrite historical assets or prove compatibility with every historical
release. Importers must identify the actual supported contract/consumer and
reject unsupported bindings, without trying alternate AADs. See
[Protection adoption](protection-adoption.md) for the exact evidence boundary.

## 6. Non-collapse and unsupported input

Unknown or unsupported profiles fail closed. An explicit legacy developer
import, where separately supported, is a distinct operation and never an
implicit fallback from protected public admission.

All profile IDs in section 2 remain distinct. Neither a KDF token, shared AES
algorithm, successful decryption, nor a matching title permits cross-profile
reinterpretation. RFC-0018's selected-slot failure codes do not automatically
become the error contract of retained helpers that throw ordinary errors.

## 7. Conformance evidence

The [RFC-0018 runner](../conformance/envelope-aead.mjs) and
[known-answer vectors](../conformance/envelope-aead/) exercise the local
algorithm implementation. Run `npm run conformance:envelope-aead`.

Base conformance and optional Argon2id capability results must be reported
separately under RFC-0018 R9. Required evidence includes normal scrypt
processing, independently wrapped slots yielding one CEK, explicit mixed-slot
selection, wrong credential/slot and tampering rejection, and named optional
capability rejection. A claim of Argon2id support additionally requires actual
Argon2id decryption. Schema validation proves shape, not decryption; neither
schema success nor a skip can count as an algorithm pass.

The runner does not call a canonical-envelope Core public consumer. Its
success is local algorithm evidence, not integration evidence for historical grammar.3
ordinary admission or current R2 explicit Node protection, installed-package
acceptance, Swift parity, all-platform conformance, account service operation,
or stable publication. Each consumer or platform needs its own byte-bound
receipt; the next integration requirements are in
[Protection adoption](protection-adoption.md).

## 8. Separate protection integration candidate

[Protection admission /1](protection-admission.md) fixes a definition candidate
for explicit canonical/external envelope admission and integrity-only plaintext.
Its new checksums.document/1 does not change the old E0.1 document; kdsig0.1 keeps
its own exact legacy digest. Envelope metadata stays in payload.kdnab. The historical
B0 schemas/types alone were not callable support. Core0.30.0-rc.protection.1 and
Read0.7.0-rc.protection.1 provide the B1 candidate Node surfaces; exact installed
consumer, fixed-vector and lifecycle evidence still require independent review.

The paragraph above records the historical B1 candidate. The current unpublished
local package line is Core `0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1`, as recorded
in [public-semantic-source.json](public-semantic-source.json) (`engineering.package_versions`)
and the package metadata. Current package coordinates do not upgrade historical
acceptance scope or imply public release; pinned historical documents and accepted
consumer graphs retain their own identities until separately updated.

The published Core `0.37.0` / Read `0.11.1` releases retain their original artifacts and release evidence. The browser package candidate remains unpublished and requires separate artifact and installed-consumer acceptance.
