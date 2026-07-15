# KDNA Encryption & Authorization — Design Specification

> Draft security/product-layer design. Current KDNA Core public beta focuses on
> local packaged `.kdna` validation, LoadPlan, and loading. Production
> encryption, paid authorization, hosted distribution, and signature trust are
> not current launch requirements.

> **Status:** Design specification with CLI/core MVP implemented. Licensed `.kdna` uses the `kdna.encryption.licensed-entry` encrypted-entry profile. License activation, sync, revocation, offline grace, and audit events are defined in [KDNA Entitlement API](../specs/kdna-entitlement-api.md). See [KCL-1.0](../specs/LICENSE-KCL-1.0.md) for the canonical commercial license.

## Overview

KDNA domains with `access: licensed` or `access: runtime` require protection mechanisms. This document defines the technical approach for encrypted containers, license verification, and enterprise authorization.

## Access Modes

| Mode | Distribution | Loading | Example |
|------|-------------|---------|---------|
| `open` | Public registry | Free, any agent | @aikdna/writing |
| `licensed` | Encrypted `.kdna` file | Requires local license key | @aikdna/writing-pro |
| `runtime` | Server-side only | Requires API call to runtime | Enterprise domains |

## Licensed `.kdna` Container

For `licensed` domains, selected internal entries are encrypted inside the same `.kdna` asset:

- Extension: `.kdna`
- Profile: `kdna.encryption.licensed-entry`
- Encryption: AES-256-GCM per protected entry
- Key: Derived from license key + machine fingerprint
- The `kdna.json` manifest is stored in plaintext for discovery; only KDNA JSON files are encrypted

### Container Structure

```
writing-pro.kdna
├── kdna.json          (plaintext — metadata for discovery)
├── KDNA_Core.json     (encrypted)
├── KDNA_Patterns.json (encrypted)
└── KDNA_Scenarios.json(encrypted)
```

License requirements are declared in `kdna.json` under `access` and
`encryption`. Local activation state is stored outside the asset under
`~/.kdna/licenses/`.

### Manifest Encryption Fields

```json
{
  "access": "licensed",
  "encryption": {
    "profile": "kdna.encryption.licensed-entry",
    "encrypted_entries": [
      "KDNA_Core.json",
      "KDNA_Patterns.json"
    ]
  },
  "license": {
    "type": "KCL-1.0",
    "url": "https://aikdna.com/licenses/KCL-1.0"
  }
}
```

## License Verification

### Local License File

```json
{
  "version": "1.0",
  "license_id": "lic_abc123",
  "domain": "@aikdna/writing-pro",
  "issued_to": "user@example.com",
  "issued_at": "2026-05-23",
  "expires_at": "2027-05-23",
  "machine_fingerprint": "sha256-of-hardware-identifiers",
  "signature": "ed25519:..."
}
```

### Verification Flow

```
1. Agent requests kdna load @aikdna/writing-pro
2. CLI checks kdna.json → access: licensed
3. CLI reads local activation from ~/.kdna/licenses/
4. Verify machine binding, expiration, revocation, and offline grace
5. Derive decryption key from license key + fingerprint
6. Decrypt protected KDNA entries into memory
7. Load domain into agent context
8. Never write decrypted files to disk

Activation and sync request/response schemas are defined in
`specs/kdna-entitlement-api.md`.
```

### Machine Fingerprint

```
fingerprint = sha256(
  hardware_uuid +
  hostname +
  user_id
)
```

Collected via OS-specific APIs:
- macOS: `IOPlatformUUID` + `hostname` + `getuid()`
- Linux: `/etc/machine-id` + `hostname` + `getuid()`
- Windows: `MachineGuid` from registry + hostname

## Runtime Domain (Server-Side)

For `access: runtime` domains, KDNA files never leave the server:

### Flow

```
1. Agent requests kdna load @aikdna/enterprise_sales
2. CLI sends task projection request to runtime server
3. Server loads domain, builds judgment context
4. Server returns agent-ready context (prompt mode)
5. Agent applies context silently
6. Postvalidate: agent sends result back to server for audit
```

### Runtime API

```
POST /project
{
  "domain": "@aikdna/enterprise_sales",
  "task": { "type": "sales_diagnosis", "input": "..." },
  "agent": "claude_code",
  "license_key": "lic_xyz",
  "machine_fingerprint": "..."
}

Response:
{
  "context": "KDNA prompt-format context...",
  "watermark": "trace_abc123",
  "axioms_activated": ["AX-001", "AX-003"],
  "load_profile": "full"
}
```

### Watermarking

Every runtime response includes a watermark trace ID for audit:

```
[KDNA:enterprise_sales/ax-001]
```

This is stripped from user-visible output but logged for compliance. The watermark:
- Ties output to specific domain version
- Enables audit trail reconstruction
- Proves licensed domain was used

## Enterprise Private Registry

Organizations can host private registries with their own signing keys:

```json
{
  "scopes": {
    "@mycorp": {
      "type": "enterprise",
      "trust_pubkey": "ed25519:my-corp-key-fingerprint",
      "registry_url": "https://registry.mycorp.internal/domains.json",
      "verified": true,
      "license_server": "https://license.mycorp.internal/verify"
    }
  }
}
```

### Enterprise Features

| Feature | Open | Enterprise |
|---------|:----:|:----------:|
| Public registry | Yes | Yes |
| Private registry | No | Yes |
| Self-signed domains | No | Yes |
| License server | No | Optional |
| SSO integration | No | Yes |
| Audit logging | No | Yes |
| Air-gapped install | No | Yes |
| Custom quality badges | No | Yes |

## Security Considerations

1. **Decryption in memory only** — KDNA JSON files never written to disk in plaintext
2. **Key derivation** — Encryption key is derived from license + fingerprint, not stored
3. **No key escrow** — Scope authors hold signing keys; KDNA team cannot decrypt licensed domains
4. **Revocation** — Licenses can be revoked server-side; grace period for offline users
5. **Tamper detection** — Signature verification catches modified containers even before decryption

## Implementation Priority

| Phase | Feature |
|-------|---------|
| **P0** | Signed containers for `open` domains (already done) |
| **P1** | Licensed `.kdna` encrypted-entry profile (CLI/Core MVP implemented) |
| **P2** | License key generation, activation, and sync (CLI MVP implemented) |
| **P3** | Machine binding, offline grace, and fail-closed checks (CLI MVP implemented) |
| **P4** | Runtime server with projection and watermarking |
| **P5** | Enterprise private registry with SSO |
