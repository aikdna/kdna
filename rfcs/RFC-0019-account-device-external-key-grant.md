# RFC-0019: Account/device external key grants

- Status: Draft
- Profile: `kdna-envelope-external-grant-v1`
- Grant: `kdna-key-grant-v1`
- Applies to: `access: "licensed"` with `entitlement.profile: "account"` or `"org"`

## 1. Problem and non-goals

An immutable encrypted KDNA asset may be downloaded by many independent
accounts. Each approved account and device needs a revocable authorization,
without publishing one shared password or storing a content-encryption key
(CEK) in the asset, application database, object metadata, logs, or traces.

RFC-0018 derives a key-encryption key from a credential carried by a key slot.
An account/device grant is not such a credential. Encoding it as a password
slot would be a compatibility fiction and would permit unsafe fallback.
Therefore this RFC defines a distinct envelope profile. A conforming runtime
MUST NOT fall back from this profile to any password, recovery, license-key, or
local-receipt profile.

This RFC does not define account registration, application review policy, or
password storage. Those belong to an identity provider and entitlement service.

## 2. Threat model and invariants

The issuer controls:

1. a 256-bit asset root secret in a managed Secrets Store;
2. an Ed25519 grant-signing key in a managed Secrets Store; and
3. the entitlement and revocation database, which stores metadata only.

The following are protocol invariants:

- a raw or wrapped asset CEK MUST NOT be stored in the `.kdna` asset, ordinary
  databases, R2 metadata, logs, traces, receipts, or CLI metadata files;
- a device private key MUST remain in a platform SecretStore;
- a grant MUST bind account, entitlement, device, asset UID, asset ID, content
  version, canonical asset digest, encrypted entry, ciphertext digest, key
  reference, and issuer key IDs;
- every authorization or cryptographic mismatch MUST fail closed;
- decrypted source exists only in process memory and MUST NOT be written to a
  canonical or diagnostic file;
- an agent receives only the normal Runtime Capsule.

Compromise of a device private key exposes only grants issued to that device.
Compromise of the application database does not expose CEKs or device private
keys. Compromise of the issuer asset root can expose every asset derived under
that root key ID and requires asset-root rotation plus asset re-encryption.

## 3. Asset envelope

The encrypted entry is deterministic CBOR containing the JSON presentation
described by `specs/kdna-envelope-external-grant-v1.schema.json`.

Required cryptographic values are:

- `profile`: `kdna-envelope-external-grant-v1`
- `alg`: `A256GCM`
- `cek_derivation`: `HKDF-SHA256`
- `key_ref`: opaque, non-secret asset key reference
- `issuer_key_id`: selects the issuer asset root secret
- `iv`: 12 random bytes, base64url without padding
- `tag`: 16 bytes, base64url without padding
- `ciphertext`: base64url without padding
- `plaintext_digest`: `sha256:<lowercase hex>`

### 3.1 CEK derivation

Let `root` be the 32-byte issuer asset root secret. Let `binding` be the UTF-8
bytes of the exact AAD in section 3.2.

```text
salt = SHA-256(binding)
info = UTF-8("kdna-external-asset-cek-v1\n" + key_ref)
CEK  = HKDF-SHA256(root, salt, info, 32)
```

The root and CEK are memory-only. `key_ref` and `issuer_key_id` are not secrets.

### 3.2 AAD

The exact UTF-8 AAD, with no trailing newline, is:

```text
kdna-envelope-external-grant-v1
<asset_uid>
<asset_id>
<asset_version>
<entry_path>
<plaintext_digest>
<key_ref>
<issuer_key_id>
licensed
<entitlement_profile>
```

The canonical package `asset_digest` cannot appear in this AAD because it
includes the encrypted entry and would create a digest cycle. The signed grant
binds that final digest after packaging. The AAD instead binds immutable asset
identity and the plaintext digest.

## 4. Device keys and proof of possession

Each CLI installation creates two independent key pairs:

- X25519 key agreement, used only to unwrap a device grant;
- Ed25519 signing, used for activation and sync proof of possession.

Public keys use raw 32-byte base64url values prefixed with `x25519:` or
`ed25519:`. Private keys MUST be non-exportable where the platform supports it;
otherwise their encoded value MUST be held only by the platform SecretStore.
Machine fingerprints are not cryptographic device identity for this profile.

An activation or sync endpoint MUST issue a single-use random challenge and
verify an Ed25519 signature over the endpoint-defined canonical request before
issuing a grant. Challenges MUST expire, be transaction-bound, and be consumed
atomically.

## 5. Signed key grant

`kdna-key-grant-v1` uses the schema in
`specs/kdna-key-grant-v1.schema.json`. The signature input is UTF-8 canonical
JSON with recursively lexicographically sorted object keys, no insignificant
whitespace, and the `signature` member omitted. Array order is preserved.

The issuer:

1. verifies the account entitlement is active and the device is authorized;
2. derives the asset CEK in memory using section 3.1;
3. generates an ephemeral X25519 key pair;
4. computes `shared = X25519(ephemeral_private, device_public)`;
5. derives `KEK = HKDF-SHA256(shared, wrap.salt,
   UTF-8("kdna-device-grant-kek-v1\n" + grant_id), 32)`;
6. wraps the 32-byte CEK using AES-256-KW (RFC 3394);
7. destroys the CEK, KEK, shared secret, and ephemeral private key; and
8. signs the grant with Ed25519.

The grant contains `refresh_after`, `offline_grace_until`, and `expires_at`.
Before `refresh_after`, an active grant is loadable. After `refresh_after`, an
online runtime MUST sync. An offline runtime MAY load only when offline use was
requested and the current time is no later than both `offline_grace_until` and
`expires_at`. `expires_at` is a hard stop.

`status` MUST be `active` to load. `revoked`, `expired`, unknown status, invalid
signature, unknown issuer key ID, stale status version, or any binding mismatch
MUST fail closed. A service SHOULD keep grants short-lived and revocation checks
more frequent than the maximum offline grace.

`status_version` is a per-entitlement monotonic counter. A client MUST retain
the greatest verified value in its platform SecretStore and reject any later
grant with a smaller value. Resetting or removing that state requires an
explicit local entitlement removal and a new device activation. A client MUST
also retain the greatest verified local time and reject a material clock
rollback; implementations MAY allow at most five minutes of clock skew. These
checks prevent replay of an older, otherwise correctly signed grant.

## 6. Runtime verification order

A runtime MUST perform these checks before plaintext parsing:

1. validate envelope and grant schemas with unknown fields rejected;
2. resolve a pinned issuer public key by `signing_key_id`;
3. verify the Ed25519 grant signature;
4. verify grant status, time window, monotonic status version, and local clock;
5. compare account/device expectations, including both device public keys;
6. compare manifest asset ID, UID, version, access, entitlement profile, entry
   path, `checksums.json.asset_digest`, and ciphertext SHA-256;
7. derive the device KEK and AES-KW unwrap the CEK;
8. verify the envelope AAD and AES-GCM tag;
9. verify `plaintext_digest`; and
10. parse the payload and emit a Runtime Capsule.

No step may be skipped because a caller supplies `status: active`. A LoadPlan may
report `ready` for an account profile only when produced from a verified,
in-memory external-grant session. A plain status string is diagnostic only and
MUST NOT authorize account assets.

## 7. Rotation and revocation

Credential rotation invalidates the old activation credential immediately and
does not reveal the replacement after its one-time response. Device grants are
independent of that credential and remain bounded by their signed refresh and
expiry window.

Entitlement or device revocation prevents new grants immediately. A successful
sync installs a signed `revoked` status response or removes the local grant. An
offline device can continue only inside an already-issued offline window; this
is the explicit availability/revocation trade-off and MUST be visible to the
reviewer when configuring policy.

Issuer grant-signing keys rotate by publishing a new pinned public key ID while
retaining old public keys until all grants they signed expire. Asset-root
rotation is separate: it changes `issuer_key_id`, re-encrypts the asset, changes
the canonical asset digest, and requires new grants.

## 8. Privacy and observability

Logs and traces may include opaque account, entitlement, device, grant, and
asset IDs, status, timestamps, and error codes. They MUST NOT include activation
credentials, challenges, proof signatures, private keys, CEKs, KEKs, shared
secrets, wrapped CEKs, envelope plaintext, or full grants.

Implementations SHOULD expose stable error codes such as
`KDNA_GRANT_SIGNATURE_INVALID`, `KDNA_GRANT_REVOKED`, `KDNA_GRANT_EXPIRED`,
`KDNA_GRANT_DEVICE_MISMATCH`, `KDNA_GRANT_ASSET_MISMATCH`, and
`KDNA_GRANT_DIGEST_MISMATCH`, while keeping cryptographic provider error bodies
out of public output.
