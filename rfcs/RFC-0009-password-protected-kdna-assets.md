# RFC-0009: Password-Protected KDNA Assets

Status: draft

## Summary

This RFC defines `access: "protected"`, a new KDNA access mode for personal and small-team use. Protected assets remain canonical `.kdna` containers with entry-level encryption, but use a user-provided password and an optional recovery code instead of a commercial license key. This extends KDNA from institutional licensing to individual creator asset protection without introducing new file formats or private envelopes.

## Motivation

RFC-0008 (`licensed`) serves B2B authorization well: high-entropy license keys, machine binding, revocation, entitlement servers, and audit trails. But individual creators and small teams have different needs:

- They do not run license servers.
- They want a password they can remember.
- They want to share a `.kdna` file with a friend by simply telling them the password.
- They want a recovery path if they forget the password.
- They do not need revocation, machine binding, or offline grace periods.

`access: "protected"` fills this gap. It is simpler than `licensed`, but it is still entry-level encryption inside a canonical `.kdna` container. There is no `.kdnapass`, `.kdnasealed`, or other non-canonical envelope.

## Relationship to RFC-0008

| Aspect | `access: "protected"` (this RFC) | `access: "licensed"` (RFC-0008) |
|--------|----------------------------------|--------------------------------|
| Encryption level | Entry-level inside `.kdna` | Entry-level inside `.kdna` |
| Key derivation | Argon2id (password → KEK) | HKDF-SHA256 (license key → KWK) |
| User credential | User-chosen password | System-generated license key |
| Recovery | Recovery code (independent key slot) | Contact administrator / re-issue |
| Revocation | None | Registry + license server |
| Machine binding | None | Optional |
| Offline policy | Always offline | `offline_grace_days` |
| Suitable for | Personal, friends, small team | Commercial, enterprise, resale |

Both modes use the same envelope structure and AES-256-GCM content encryption. They differ only in how the content encryption key (CEK) is wrapped.

## Access Mode

The manifest `access` field gains a new value:

```json
{
  "access": "protected"
}
```

Future extensions (passkey, hardware key, local keychain biometric) MAY reuse `access: "protected"` with different `encryption.profile` values. The access mode name remains abstract.

## Encryption Profile

The profile name is `kdna-password-protected-v1`.

### Algorithms

- Content encryption: `AES-256-GCM` (same as RFC-0008).
- Password-based key derivation: `Argon2id` (RFC 9106).
- Key wrapping: `AES-256-KW` (RFC 3394, same as RFC-0008).
- Per-entry nonce: unique 96-bit nonce for AES-GCM.

### Key Model

1. Studio export generates a random 32-byte content encryption key (CEK) per asset.
2. The CEK encrypts protected entries with AES-256-GCM.
3. The CEK is wrapped by two independent key slots:
   - **Password slot**: CEK wrapped by a KEK derived from the user password via Argon2id.
   - **Recovery slot**: CEK wrapped by a KEK that is a high-entropy random value (the recovery code).
4. Either slot can unwrap the CEK. Both slots are stored in the entry envelope.
5. Password change re-wraps the CEK into a new password slot; the recovery slot remains unchanged unless explicitly rotated.

### Argon2id Parameters

Default parameters for desktop environments (RFC 9106, high-memory configuration adapted for general-purpose machines):

| Parameter | Default | Description |
|-----------|---------|-------------|
| `memory_kib` | 65536 | 64 MiB |
| `iterations` | 3 | Passes |
| `parallelism` | 4 | Parallel threads |
| `salt` | 16 random bytes | Unique per asset |
| `output_length` | 32 | KEK length |

Implementations MAY increase `memory_kib` on capable devices. The manifest MUST record the actual parameters so that future implementations can decrypt even if defaults change.

### Envelope Schema

Each encrypted entry inside the `.kdna` container is a JSON object:

```json
{
  "profile": "kdna-password-protected-v1",
  "alg": "AES-256-GCM",
  "kdf": "Argon2id",
  "key_wrapping": "AES-256-KW",
  "password_kdf": {
    "name": "Argon2id",
    "salt": "<base64>",
    "memory_kib": 65536,
    "iterations": 3,
    "parallelism": 4
  },
  "key_slots": [
    {
      "slot": "password",
      "wrap": "AES-256-KW",
      "wrapped_key": "<base64>"
    },
    {
      "slot": "recovery",
      "wrap": "AES-256-KW",
      "wrapped_key": "<base64>"
    }
  ],
  "iv": "<base64>",
  "tag": "<base64>",
  "ciphertext": "<base64>"
}
```

Field constraints:

| Field | Format | Size (decoded) |
|-------|--------|----------------|
| `password_kdf.salt` | Base64 | 16 bytes |
| `key_slots[].wrapped_key` | Base64 | 40 bytes (AES-256-KW output for 32-byte CEK) |
| `iv` | Base64 | 12 bytes |
| `tag` | Base64 | 16 bytes |
| `ciphertext` | Base64 | Variable |

A protected asset MUST include at least a `password` slot. It MAY include a `recovery` slot. It MUST NOT include other slot types in this profile version.

### AAD Format

Additional authenticated data for AES-256-GCM is the UTF-8 encoding of four lines joined by `\n` (LF, U+000A):

```
kdna-password-protected-v1
<manifest.name>
<manifest.version>
<entryName>
```

This is identical in structure to RFC-0008 AAD, but with the profile name changed.

## Recovery Code

### Generation

The recovery code is a high-entropy random value generated at export time:

- Minimum 128 bits (16 bytes) of randomness.
- Encoded for human use as a grouped character string or BIP39-style mnemonic.
- MUST NOT be user-chosen.
- MUST be displayed exactly once during export; it MUST NOT be retrievable later.

Example formats:

```text
kdna-recover-7F3K-L9Q2-M8V1-X4P6
```

or

```text
kdna-recover-apple-mountain-river-cloud-forest-stone
```

### Storage Recommendation

The recovery code is the independent second key. Users SHOULD be instructed to:

- Print it and store offline.
- Save it in a password manager.
- Treat it with the same care as the password.

The UI warning MUST state clearly:

> If you lose both your password and recovery code, this asset cannot be decrypted. There is no back door.

### Recovery Flow

1. User selects "Forgot password" in the consuming app.
2. User enters the recovery code.
3. Implementation decodes the recovery code to its raw bytes, uses it directly as the KEK, and unwraps the CEK from the `recovery` slot.
4. User sets a new password.
5. A new `password` slot is computed (new Argon2id salt + parameters + new KEK → re-wrap CEK).
6. The old `password` slot is replaced. The `recovery` slot MAY be retained or rotated at the user's choice.

The content itself is never re-encrypted; only the CEK wrapping changes.

## Password Change

1. User provides the current password.
2. Implementation derives KEK, unwraps CEK from the current `password` slot.
3. User provides a new password.
4. Implementation generates a new Argon2id salt, derives a new KEK, wraps the same CEK into a new `password` slot.
5. The old `password` slot is atomically replaced.

If the user does not remember the current password but has the recovery code, the recovery flow is used first, followed by a password change.

## Digest and Signature Rules

Same as RFC-0008:

- `asset_digest` covers the complete `.kdna` bytes, including ciphertext and encryption metadata.
- `content_digest` covers the internal tree as stored. For encrypted entries, the input is the ciphertext envelope.
- Registry and CLI verification MUST be possible without decrypting.

### Resealed Asset Rules

When an asset is protected (`kdna protect`) or recovered (`kdna recover`), the encrypted entries receive new ciphertext envelopes (new CEK, IV, wrapped keys, and tags). This changes the asset's content digest and invalidates any existing signature.

Implementations MUST:

1. **Recompute `content_digest`** after producing the resealed asset, using the same canonical digest algorithm as for open assets.
2. **Strip `signature`** from the manifest, because the signing payload no longer matches the encrypted content.
3. **Strip `asset_digest` and `container_sha256`** if present, because the raw bytes have changed.
4. **Preserve asset identity** (`asset_uid`, `project_uid`, `build_id`, `domain_id`, `authoring`) so the asset remains traceable to its origin.
5. **Preserve or update `updated_at`** to reflect the reseal operation.

A recovered asset is therefore **unsigned but structurally valid**. Re-signing after recovery requires the original author's private key and is a separate, optional step.

## Plaintext and Encrypted Entry Rules

Same as RFC-0008:

- `mimetype`, `kdna.json`, `README.md`, `LICENSE`, `KDNA_CARD.json`, `signature.json`, and public reports MUST remain plaintext.
- `KDNA_Core.json`, `KDNA_Patterns.json`, and optional judgment entries MAY be encrypted.
- Encrypted entries MUST be declared in `kdna.json` under `encryption.encrypted_entries`.

## Security Considerations

### Offline Brute Force

Because `.kdna` files can be copied, an attacker can attempt offline password guessing. The defense is entirely in the Argon2id parameters:

- `memory_kib` and `iterations` MUST be high enough to make mass guessing infeasible.
- Implementations SHOULD warn users when they choose a weak password, but MUST NOT refuse weak passwords outright (user autonomy).
- Rate limiting in the UI prevents casual guessing but does not protect against offline attack.

### Argon2id Parameter Upgrade

The manifest records the exact Argon2id parameters used at creation time. If future defaults increase, legacy assets still decrypt. Implementations MAY support "re-wrap on unlock": after successful decryption with old parameters, re-wrap the CEK with new parameters and update the envelope. This is optional and MUST preserve the recovery slot.

### Recovery Code Exposure

A recovery code is as powerful as the password. If an attacker obtains the `.kdna` file and the recovery code, they can decrypt. Users MUST be warned that the recovery code is not a "backup of the password" but a second independent key.

### Decrypted Content Handling

Same as RFC-0008: decrypted plaintext MUST remain in volatile memory only. Implementations MUST NOT write decrypted entries to persistent disk, logs, traces, or audit events.

### Cache Policy

Consumer applications (KDNAChat, KDNAWork) MUST NOT cache decrypted JSON to disk for performance. If caching is absolutely necessary, the cache MUST be encrypted at rest with a key tied to the local device (e.g., Keychain/Secure Enclave), and the cache MUST be clearly marked as derived, untrusted, and rebuildable.

## Conformance Test Vectors

### Reference Password

```text
KDNA-TEST-VECTOR-2026
```

### Reference Recovery Code

Raw bytes (hex):

```text
aabbccdd11223344556677889900aabb
```

Encoded for human use:

```text
kdna-recover-7F3K-L9Q2-M8V1-X4P6
```

### Argon2id Parameters

```json
{
  "name": "Argon2id",
  "salt": "AAAAAAAAAAAAAAAAAAAAAA==",
  "memory_kib": 65536,
  "iterations": 3,
  "parallelism": 4
}
```

(The example salt above is 16 zero bytes for test determinism. Real assets MUST use random salts.)

### Decryption Pipeline

1. Obtain the user password or recovery code bytes.
2. If using password: run Argon2id with the recorded `password_kdf` parameters to derive KEK.
3. If using recovery code: use the decoded recovery code bytes directly as KEK.
4. Unwrap CEK from the appropriate `key_slots[].wrapped_key` using AES-256-KW.
5. Decrypt `ciphertext` with CEK, `iv`, and AAD; verify `tag`.
6. Return plaintext bytes.

### Error Conditions

Implementations MUST reject with a distinct error when:

- `profile` is not `kdna-password-protected-v1`.
- `alg` is not `AES-256-GCM`.
- `kdf` is not `Argon2id`.
- `key_wrapping` is not `AES-256-KW`.
- `password_kdf` parameters are missing or invalid.
- `key_slots` does not contain a `password` slot.
- Argon2id derivation fails or produces wrong KEK (unavoidable; manifests as AES-KW unwrap failure).
- AES-256-KW unwrap fails (wrong password, wrong recovery code, or corrupted slot).
- AES-GCM authentication fails (ciphertext tampered, wrong CEK, wrong AAD).

## Compatibility Impact

- `access: "protected"` is a new value. Older loaders that do not recognize it MUST reject the asset or treat it as unsupported rather than defaulting to open.
- The `encryption.profile` value `kdna-password-protected-v1` is new. Loaders that support only `kdna-licensed-entry-v1` MUST reject this profile cleanly.
- Manifest schema is backward compatible: new fields are inside `encryption`, which already exists in RFC-0008.

## Open Questions

- Whether to mandate a minimum password entropy metric in the UI specification.
- Whether to define a future `kdna-password-protected-v2` using `XChaCha20-Poly1305`.
- Whether registry entries for `access: "protected"` assets should still publish `asset_digest` and quality badges in the same way as open assets (recommended: yes, because metadata is plaintext).
