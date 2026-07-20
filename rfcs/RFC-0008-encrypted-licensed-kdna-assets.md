# RFC-0008: Encrypted and Licensed KDNA Assets

Status: superseded — active compatibility-only. The encryption profile name
`kdna.encryption.licensed-entry`, the core algorithm choices (AES-256-GCM,
HKDF-SHA256), and the fail-closed entitlement state diagram remain the basis of
the current container-level licensed-entry implementation. The per-entry
encryption model and source-tree file targets described in the body of this RFC
are superseded by the [Container spec](../specs/container.md) and unified
`payload.kdnab` envelope AEAD
([conformance](../conformance/envelope-aead.mjs)).

Any asset-signature field, entry, digest rule, or verification command in the
historical body is also superseded. The current Preview rejects asset-level
signature representations; external grant and confirmation signatures remain
separate contracts.

## Summary

Licensed KDNA assets use the same `.kdna` container and media type as open
assets, but selected internal entries may be encrypted. The manifest remains
plaintext for discovery, registry verification, entitlement checks, and runtime
policy.

## Motivation

KDNA supports public, licensed, and remote access modes. Licensed assets need a
single interoperable container profile so that Studio exporters, CLI verifiers,
registries, and runtimes agree on what is encrypted, what stays public, how
digests and signatures are computed, and how licenses unlock protected
judgment only in memory.

## Plaintext Entries

The following entries MUST remain plaintext:

- `mimetype`
- `kdna.json`
- `README.md`
- `LICENSE`
- `KDNA_CARD.json`
- public `reports/` entries required to justify quality claims
- `signature.json`, when present
- entitlement or encryption metadata entries

Plaintext metadata MUST NOT expose protected proprietary judgment content.

## Encrypted Entries

The following entries MAY be encrypted:

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- optional `KDNA_*.json` judgment entries
- private eval raw outputs
- private implementation notes

Assets MAY mix plaintext and encrypted entries. Encrypted entries MUST be
declared in `kdna.json` under `encryption.encrypted_entries`.

## Encryption Profile

The baseline profile is `kdna.encryption.licensed-entry`.

Required algorithms:

- Content encryption: `AES-256-GCM`.
- Key derivation or wrapping: `HKDF-SHA256` plus authenticated key wrapping, or
  a public-key wrapping profile named in `encryption.key_wrapping`.
- Per-entry nonce: unique 96-bit nonce for AES-GCM.
- Authentication tag: stored with each encrypted entry.

Implementations MAY add `XChaCha20-Poly1305` as a future profile, but MUST NOT
label it `kdna.encryption.licensed-entry`.

## Key Model

1. Studio export generates a random content encryption key per asset.
2. The content key encrypts protected entries.
3. A license activation exchanges or unwraps an entitlement key that can unwrap
   the content key for an authorized user, machine, organization, or offline
   license.
4. License keys MUST NOT be the raw content encryption key.
5. Revocation targets license grants or wrapped keys, not the immutable asset
   bytes.

## Digest and Signature Rules

`asset_digest` is computed over the complete `.kdna` file bytes, including
ciphertext and encryption metadata.

`content_digest` is computed over the canonical internal content tree as stored
in the asset. For encrypted entries, the digest input is the ciphertext envelope
and metadata, not decrypted plaintext. A Studio exporter MAY also produce a
detached private plaintext review digest for expert review, but that digest is
not the registry install digest.

Signatures cover the canonical payload as stored in the asset. Registry and CLI
verification MUST be possible without decrypting protected entries.

## License Activation

Runtimes MUST:

- verify the `.kdna` asset digest before license activation;
- verify signature requirements before loading protected entries;
- validate license signature, subject, scope, expiry, and revocation state;
- unwrap keys only after entitlement validation;
- decrypt protected entries in memory only;
- avoid writing decrypted entries to persistent disk.

Offline licenses MAY include an expiry, machine binding, and signed revocation
snapshot. Offline grace periods MUST be explicit in the license metadata.

## Yank and Revocation

Registry yanks prevent new installs. Registry revocations MUST block matching
assets by `name`, `version`, or `asset_digest`. License revocation prevents
future decryption even if an asset remains installed.

## Evaluation and Review Evidence

Encrypted assets can claim `tested` or higher only when they publish enough
plaintext evidence for the claimed badge:

- public eval case descriptions or redacted cases;
- quality gate report;
- human-lock report;
- provenance report;
- reviewer signature or review report for expert levels.

Private raw outputs MAY remain encrypted, but the registry MUST have enough
public or authorized review evidence to validate the quality claim.

## Security Considerations

Container-level ZIP encryption is forbidden. Encryption occurs at the internal
entry level with authenticated encryption. Plaintext manifest metadata must be
minimal, truthful, and sufficient for policy decisions. Loaders must treat
decrypted content as sensitive runtime memory.

## Conformance Test Vectors

Implementations MUST be able to decrypt a fixture produced by the reference
implementation using the following reference values.

### Reference Key

```text
KDNA-TEST-LICENSE-VECTOR-2026
```

### Key Derivation

The key-wrapping key (KWK) is derived from the license key via HKDF-SHA256
(RFC 5869):

- IKM: `KDNA-TEST-LICENSE-VECTOR-2026` (UTF-8)
- Salt: 32 zero bytes (`0x00 * 32`)
- Info: `kdna.encryption.licensed-entry-kwk` (UTF-8)
- Output length: 32 bytes

### AAD Format

Additional authenticated data for AES-256-GCM is the UTF-8 encoding of four
lines joined by `\n` (LF, U+000A):

```
kdna.encryption.licensed-entry
<manifest.name>
<manifest.version>
<entryName>
```

Example:

```text
kdna.encryption.licensed-entry
@aikdna/writing
1.0.0
KDNA_Core.json
```

### Envelope Schema

Each encrypted entry inside the `.kdna` container is a JSON object with exactly
these fields:

```json
{
  "profile": "kdna.encryption.licensed-entry",
  "alg": "AES-256-GCM",
  "kdf": "HKDF-SHA256",
  "key_wrapping": "AES-256-KW",
  "wrapped_key": "<base64>",
  "iv": "<base64>",
  "tag": "<base64>",
  "ciphertext": "<base64>"
}
```

Field constraints:

| Field | Format | Size (decoded) |
|-------|--------|----------------|
| `wrapped_key` | Base64 | 40 bytes (AES-256-KW output for 32-byte CEK) |
| `iv` | Base64 | 12 bytes (96-bit nonce) |
| `tag` | Base64 | 16 bytes (AES-GCM authentication tag) |
| `ciphertext` | Base64 | Variable |

### Encryption Pipeline

1. Generate a random 32-byte content encryption key (CEK).
2. Derive KWK from license key via HKDF-SHA256 as specified above.
3. Wrap CEK with KWK using AES-256-KW (RFC 3394) → 40 bytes.
4. Encrypt plaintext with CEK using AES-256-GCM and the AAD defined above.
5. Encode `wrapped_key`, `iv`, `tag`, and `ciphertext` as Base64.

### Decryption Pipeline

1. Derive KWK from license key via HKDF-SHA256.
2. Unwrap CEK from `wrapped_key` using AES-256-KW; verify integrity.
3. Decrypt `ciphertext` with CEK, `iv`, and AAD; verify `tag`.
4. Return plaintext bytes.

### Error Conditions

Implementations MUST reject with a distinct error when:

- `profile` is not `kdna.encryption.licensed-entry`.
- `alg` is not `AES-256-GCM`.
- `kdf` is not `HKDF-SHA256`.
- `key_wrapping` is not `AES-256-KW`.
- `wrapped_key` is not valid Base64 or not exactly 40 bytes after decoding.
- AES-256-KW unwrap fails (integrity check failure).
- `iv` is not 12 bytes after decoding.
- `tag` is not 16 bytes after decoding.
- AES-GCM authentication fails (ciphertext tampered, wrong key, wrong AAD).

### Memory-Only Rule

Decrypted plaintext MUST remain in volatile memory only. Implementations MUST
NOT write decrypted entries to persistent disk, logs, traces, or audit events.

## Open Questions

- Whether `XChaCha20-Poly1305` should be promoted to a second required profile.
- Whether registry-hosted transparency logs should publish encrypted-entry
  envelope hashes separately from whole-file `asset_digest`.
