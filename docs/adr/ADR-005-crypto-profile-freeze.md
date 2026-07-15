# ADR-005: Crypto Profile Freeze

- **Status**: accepted
- **Date**: 2026-06-25
- **Deciders**: KDNA Core team

## Context

The KDNA ecosystem has three encryption profiles, two of which are partially implemented:

| Profile | JS Core | Swift Core | Status |
|---|---|---|---|
| `kdna.encryption.licensed-entry` (RFC-0008, HKDF + AES-KW + AES-GCM) | Implemented | Implemented | Canonical write candidate |
| `kdna-licensed-entry-experimental` (scrypt-sha256) | Implemented | Rejected: "scrypt not available in Swift core" | Compatibility only |
| `kdna.encryption.password` (RFC-0009, Argon2id + AES-KW + AES-GCM) | Implemented | Implemented | Password protection |

Additionally, there are critical security gaps:
- Swift `KDNALicenseTypes.verifySignature()` always returns `true` (placeholder)
- No cross-language test vectors exist for any crypto profile
- Secret store is designed but has zero implementations
- Multiple SECURITY.md files claim Ed25519/AES-256-GCM/Argon2id for packages that implement none of these

## Decision

1. **No new encryption profiles SHALL be added** until all existing profiles are inventoried, frozen, and covered by cross-language test vectors.

2. **Profile classification:**
   - `kdna.envelope.aead` (or equivalent from design doc) is the future **canonical write profile**.
   - All other profiles are **read-only compatibility profiles**.
   - The canonical write profile selection must be made by a separate ADR after B1-B4 are complete.

3. **Cross-language golden test vectors** (JS + Swift) MUST exist before any profile is declared production-ready. The vectors cover: manifest, container, crypto encrypt/decrypt, LoadPlan output.

4. **Capability honesty:** Any platform that has not implemented real signature verification, decryption, or container security checks MUST explicitly return `unsupported` or `denied`. Placeholder implementations (`return true`, `encrypted: false` hardcoded) are FORBIDDEN.

5. **Swift `KDNALicenseTypes.verifySignature()` MUST choose exactly one:**
   - Implement real Ed25519 verification
   - Return `unsupported` for the corresponding entitlement
   
   There is no "temporary `return true`" security state.

6. **SecretStore protocol** (defined in `specs/kdna-secret-store.md`) is the required interface for all secret persistence. Plaintext JSON storage of `license_key` is deprecated for product apps. CLI/dev tools MAY keep JSON for compatibility.

## Consequences

- `kdna-app-shared/SECURITY.md` and `kdna-studio-cli/SECURITY.md` must be corrected to not claim crypto capabilities they don't implement.
- Swift `verifySignature()` must be fixed or disabled.
- A cross-language golden vector suite (B8) must be built.
- New encryption work is blocked until existing profiles are frozen and tested.
