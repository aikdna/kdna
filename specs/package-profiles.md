# KDNA Package Profiles

Version: 0.1
Status: Draft
Canonical: `specs/package-profiles.md`

## 1. Purpose

Define the three KDNA package distribution profiles. A package profile describes the format, trust model, and access control of a KDNA domain in its distributable form.

KDNA domains exist in two states:
- **Authoring form**: a directory of standard KDNA JSON files (6 files max). Used for creation, Git versioning, review, and collaboration.
- **Distribution form**: a `.kdna` package container. Used for publishing, downloading, verifying, installing, and loading.

This specification defines the distribution profiles and their containers.

---

## 2. Profile Overview

| Profile | Extension | Status | Description |
|---------|-----------|--------|-------------|
| **Open KDNA** | `.kdna` | **Stable** | Plaintext package. Free to share, inspect, and load. Signature optional but recommended. |
| **Encrypted KDNA** | `.kdnae` | **Draft** | Content-encrypted package. Requires key to decrypt. Supports device and organization recipients. |
| **Licensed KDNA** | `.kdnal` | **Draft** | License-controlled package. Requires entitlement verification. Supports subscription, trial, revocation. |

---

## 3. Open KDNA (`.kdna`) — Stable

### 3.1 Description

The `.kdna` package is the standard, open distribution format for KDNA domains. It is a ZIP-based container that bundles the domain's JSON files with a manifest.

### 3.2 Container Structure

```
domain-0.1.0.kdna
├── manifest.json          # Package metadata
├── KDNA_Core.json         # Required
├── KDNA_Patterns.json     # Required
├── KDNA_Scenarios.json    # Optional
├── KDNA_Cases.json        # Optional
├── KDNA_Reasoning.json    # Optional
├── KDNA_Evolution.json    # Optional
├── kdna.json              # Domain manifest (signature, author, license)
├── README.md              # Optional
└── signature.sig          # Optional: detached Ed25519 signature
```

### 3.3 manifest.json

```json
{
  "format": "kdna",
  "format_version": "1.0",
  "kdna_spec": "1.0-rc",
  "domain": "writing_judgment",
  "version": "0.7.2",
  "author": {
    "name": "KDNA Team",
    "id": "kdna-team"
  },
  "created_at": "2026-05-25T00:00:00Z",
  "files": [
    {"name": "KDNA_Core.json", "sha256": "..."},
    {"name": "KDNA_Patterns.json", "sha256": "..."}
  ]
}
```

### 3.4 Trust Model

- **Integrity**: SHA256 hash of each file and the container.
- **Authorship**: Ed25519 signature (optional but recommended). Stored in `kdna.json`.
- **Registry**: Registry entry provides `sha256` and `signature` for verification.
- **Risk**: Risk level (R0–R3) and quality badge declared in registry metadata.
- **Warning**: Unsigned `.kdna` must display a warning on load.

### 3.5 Usage

```bash
# Pack
kdna pack ./my_domain

# Install
kdna install @aikdna/writing

# Verify
kdna verify @aikdna/writing --trust-report

# Load
kdna load @aikdna/writing
```

---

## 4. Encrypted KDNA (`.kdnae`) — Draft

### 4.1 Description

The `.kdnae` package is a content-encrypted KDNA package. The domain content is encrypted with a symmetric content key. The content key is wrapped for each authorized recipient using their public key (envelope encryption / HPKE model).

### 4.2 Container Structure (Draft)

```
domain-1.0.0.kdnae
├── manifest.json          # Package metadata (unencrypted)
├── recipients.json        # Recipient public keys + wrapped content keys
├── encrypted_payload.bin  # Encrypted domain content
└── signature.sig          # Detached Ed25519 signature
```

### 4.3 Encryption Model

- **Scheme**: Envelope Encryption (HPKE-compatible)
- **Content key**: Randomly generated per version. Encrypts the payload (all domain files).
- **Recipient wrapping**: Content key is wrapped with each recipient's public key.
- **Algorithm**: Reference HPKE (RFC 9180). Implementation MUST use mature cryptographic libraries. Never implement custom cryptography.

### 4.4 MVP Recipient Types

| Type | Description |
|------|-------------|
| `device_public_key` | A specific device's public key. Content key wrapped for that device. |
| `organization_public_key` | An organization's public key. All org members with the corresponding private key can unwrap. |

Future extensions (not in MVP):
- `password` — password-derived key
- `license_key` — key derived from license token

### 4.5 recipients.json

```json
{
  "recipients": [
    {
      "type": "device_public_key",
      "user_id": "user_abc",
      "device_id": "dev_xyz",
      "algorithm": "X25519-HKDF-SHA256",
      "wrapped_key": "<base64>"
    },
    {
      "type": "organization_public_key",
      "org_id": "org_456",
      "algorithm": "X25519-HKDF-SHA256",
      "wrapped_key": "<base64>"
    }
  ]
}
```

### 4.6 Content Key Management

- One content key per KDNA version.
- Same content key used for all recipients of the same version.
- Version upgrade → new content key generated.
- Authorization changes → update `key_grants`, do not re-encrypt content.

---

## 5. Licensed KDNA (`.kdnal`) — Draft

### 5.1 Description

The `.kdnal` package is a license-controlled KDNA package. Access requires entitlement verification through KDNA Cloud. Supports subscription, trial, device binding, and revocation.

### 5.2 Relationship to `.kdnae`

A `.kdnal` package MAY also be encrypted (`.kdnae`). The license policy is separate from the encryption layer:

- **`.kdnae`** solves: "Can this file be opened?" (encryption)
- **`.kdnal`** solves: "Is this user authorized to use this domain?" (entitlement)

They can be combined: a licensed domain may be encrypted for delivery and require both decryption AND entitlement verification.

### 5.3 License Policy (Draft)

```json
{
  "license": {
    "type": "subscription",
    "model": "personal",
    "price": "$9/month",
    "trial_days": 7,
    "max_devices": 2,
    "offline_days": 30,
    "auto_renewal": false,
    "refund_policy": "7-day money back"
  }
}
```

### 5.4 Entitlement Verification

1. Client requests download with license token
2. KDNA Cloud verifies entitlement (active, not expired, not revoked, device limit not exceeded)
3. If encrypted, Cloud returns wrapped content key for this device
4. Client decrypts and loads the domain
5. Offline use: license lease valid for N days (default 30). Must refresh online before expiry.
6. R2/R3 risk domains: offline lease shorter (7-14 days) or online-only.

---

## 6. Profile Comparison

| Feature | `.kdna` | `.kdnae` | `.kdnal` |
|---------|:---:|:---:|:---:|
| Content visible | ✅ | ❌ (encrypted) | ❌ (controlled) |
| Free to share | ✅ | ✅ (but unusable without key) | ❌ |
| Signature | Optional | Recommended | Required |
| Offline use | ✅ | ✅ (with key) | ✅ (with lease) |
| Requires account | ❌ | ❌ (for decryption) | ✅ |
| Revocable | ❌ | Partial (key grant) | ✅ |
| Status | **Stable** | **Draft** | **Draft** |

---

## 7. Authoring vs Distribution

KDNA domains MUST be authored as directories (6 standard files). The `.kdna` container is a distribution format, not an editing format.

| State | Format | Purpose |
|-------|--------|---------|
| **Authoring** | Directory of JSON files | Git versioning, review, PR, diff, collaboration |
| **Distribution** | `.kdna` / `.kdnae` / `.kdnal` | Publishing, downloading, verifying, installing, loading |

Never edit a `.kdna` package directly. Always work from the source directory and repack.

---

*This specification defines the three package profiles. `.kdna` is stable. `.kdnae` and `.kdnal` are draft profiles subject to change based on implementation experience.*
