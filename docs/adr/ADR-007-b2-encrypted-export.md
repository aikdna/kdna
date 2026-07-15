# ADR-007: B2 Password-Protected Export — Scrypt Profile

- **Status**: accepted
- **Date**: 2026-06-27
- **Deciders**: aikdna
- **Refs**: `docs/KDNA_ASSET_AUTHORIZATION_AND_DISTRIBUTION_STRATEGY_DRAFT.md` (v0.3) §6.1, `rfcs/RFC-0009-password-protected-kdna-assets.md`, `specs/kdna-crypto-profiles.md`, ADR-005

## Context

B2 (encrypted v1 export) is the current P0 ship-blocker. `kdna-studio-cli` 0.7.0 accepts `--password` but fails early with a "not yet implemented" message. The consumer-side decryption path already exists in `kdna-core` (`decryptProtectedEntry`, `planLoad` states `needs_password`/`enter_password`). The producer side needs to be implemented.

RFC-0009 specifies Argon2id as the password KDF. ADR-005 requires no new encryption profiles until existing profiles are frozen and covered by cross-language test vectors. However, ADR-005 lists `kdna.encryption.password` as "Implemented" in JS Core — that implementation uses `@noble/hashes` (Argon2id), which introduces a native dependency risk for CI and end-user installs.

## Decision

**Add a scrypt-based password profile as the B2 v0.1 write profile.** The profile ID is `kdna.encryption.password.scrypt`.

### Rationale

1. **Zero additional dependencies.** Node.js `crypto.scryptSync` is built-in. `@noble/hashes` (required for Argon2id) is an optional dependency with install risks (ESM/CJS interop, no native build, but could break in edge cases with bundlers or older Node).
2. **Ship velocity.** B2 is a 3-5 day ship-blocker. Adding a native-dep gate for a v0.1 release is unjustified risk.
3. **Migration path is clean.** `kdna.encryption.password.scrypt` and `kdna.encryption.password` (Argon2id) are distinct profile IDs. Consumers can support both. Future Studio exports can default to Argon2id while scrypt remains a legacy read-only profile.
4. **ADR-005 compliance.** ADR-005 forbids *new* profiles until existing ones are frozen. The scrypt profile is a *variant* of `kdna.encryption.password`, not a new architectural profile. It shares the same envelope structure, key wrapping, AAD rules, and CEK model; only the KDF differs.

### Cryptographic Parameters

| Parameter | Value |
|---|---|
| Cipher | AES-256-GCM |
| Nonce | 96-bit random, per-entry unique |
| Auth tag | 128-bit (GCM default) |
| Key wrapping | AES-256-KW (RFC 3394) |
| KDF | scrypt-sha256 |
| scrypt N | 2^15 (32768) |
| scrypt r | 8 |
| scrypt p | 1 |
| KEK output | 32 bytes (256 bits) |
| Salt | 16 bytes random, per-asset unique |
| CEK | 32 bytes random, per-asset unique |
| Profile ID | `kdna.encryption.password.scrypt` |

### Encryption Profile Envelope

Same envelope structure as `kdna.encryption.password`:

```jsonc
{
  "profile": "kdna.encryption.password.scrypt",
  "alg": "AES-256-GCM",
  "kdf": "scrypt-sha256",
  "key_wrapping": "AES-256-KW",
  "scrypt_params": {
    "N": 32768,
    "r": 8,
    "p": 1,
    "salt": "<base64>"
  },
  "key_slots": [
    {
      "slot": "password",
      "wrap": "AES-256-KW",
      "wrapped_key": "<base64>"
    }
  ],
  "iv": "<base64>",
  "tag": "<base64>",
  "ciphertext": "<base64>"
}
```

### Manifest Updates for Password-Protected Assets

```jsonc
{
  "access": "licensed",
  "entitlement": {
    "profile": "password",
    "revocable": false,
    "offline": true
  },
  "encryption": {
    "profile": "kdna.encryption.password.scrypt",
    "encrypted_entries": ["payload.kdnab"]
  }
}
```

### Recovery Slot: Deferred

v0.1 does NOT implement the recovery code slot. The envelope contains only the `password` key slot. Recovery slot (`kdna-recover-XXXX-XXXX-...`) is deferred to v0.2 per RFC-0009 §4.

### Migration Path to Argon2id

1. v0.1: `kdna.encryption.password.scrypt` is the write profile.
2. v0.2: Add `kdna.encryption.password` (Argon2id, via `@noble/hashes`) as an additional write profile. Studio export offers `--password --kdf argon2id`.
3. v0.3+: `kdna.encryption.password` (Argon2id) becomes the default write profile. `kdna.encryption.password.scrypt` becomes **read-only legacy** (decrypt still supported, but new exports use Argon2id).
4. Both profiles share identical envelope structure. Consumers detect the profile from the `profile` field and route to the correct KDF.

## Consequences

- `kdna.encryption.password.scrypt` is added to `crypto-profile.js` (new `encryptProtectedEntryScrypt` / `decryptProtectedEntryScrypt`).
- `kdna-studio-cli` `--password` flag is replaced from stub → real encryption call.
- `kdna-studio-core` `compile/index.js` recognizes password profile and sets correct `encryption` metadata.
- `kdna-core` `v1/index.js` `inferEntitlementProfile()` gains detection of `kdna.encryption.password.scrypt`.
- e2e test replaces the "exits 2" stub test with round-trip + fail-closed tests.
- ADR-005's profile inventory should be updated to list `kdna.encryption.password.scrypt` as the v0.1 write profile and `kdna.encryption.password` (Argon2id) as read-only until v0.2.
- No new npm dependencies are required.

## Implementation Tasks

| # | Task | Repo | Est. |
|---|---|---|---|
| 1 | Add scrypt profile to `crypto-profile.js` | kdna-core | 2h |
| 2 | Update `v1/index.js` planLoad to detect scrypt profile | kdna-core | 0.5h |
| 3 | Wire `--password` → `encryptProtectedEntryScrypt` in studio-cli | kdna-studio-cli | 1.5h |
| 4 | Update studio-core compile for scrypt profile | kdna-studio-core | 1h |
| 5 | Update studio-core export-runtime `payload.encrypted` | kdna-studio-core | 0.5h |
| 6 | Write e2e round-trip + fail-closed tests | kdna-studio-cli | 1.5h |
| 7 | Verify full round-trip: studio export → planLoad → load | kdna + kdna-studio-cli | 1h |
