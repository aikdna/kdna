# KDNA Asset Profiles

Version: 0.1
Status: Draft
Canonical: `specs/package-profiles.md`

## 1. Purpose

Define the KDNA asset distribution profiles. A profile describes the access mode, trust model, and authorization controls of a KDNA asset in its distributable form.

KDNA domains exist in two forms:
- **Dev source form**: a non-canonical directory of standard KDNA JSON files. Used only by authoring tools, Git review, and debugging.
- **Asset form**: a `.kdna` container. Used for publishing, downloading, verifying, installing, loading, licensing, and runtime use.

This specification defines the distribution profiles and their containers.

---

## 2. Profile Overview

| Profile | Extension | Status | Description |
|---------|-----------|--------|-------------|
| **Open KDNA** | `.kdna` | **Stable** | Plaintext asset. Free to share, inspect, and load. Signature required for registry publication. |
| **Licensed KDNA** | `.kdna` | **Draft** | Same asset extension, selected entries encrypted with `kdna-licensed-entry-v1`. Requires local license activation before in-memory decryption. |
| **Runtime KDNA** | registry entry / API | **Draft** | Asset remains server-side. Client receives runtime projection only. |

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
  "spec_version": "1.0-rc",
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
- **Registry**: Registry entry provides `asset_digest` and `signature` for verification.
- **Risk**: Risk level (R0–R3) and quality badge declared in registry metadata.
- **Warning**: Unsigned `.kdna` must display a warning on load.

### 3.5 Usage

```bash
# Pack
kdna dev pack ./my_domain

# Install
kdna install @aikdna/writing

# Verify
kdna verify @aikdna/writing --trust-report

# Load
kdna load @aikdna/writing
```

---

## 4. Licensed KDNA (`.kdna`, `access: "licensed"`) — CLI/Core MVP implemented

### 4.1 Description

Licensed KDNA uses the same `.kdna` asset extension. The manifest remains plaintext for discovery, while protected entries are encrypted with AES-256-GCM under the `kdna-licensed-entry-v1` encrypted-entry profile.

### 4.2 Container Structure (Draft)

```
domain-1.0.0.kdna
├── kdna.json              # Plaintext manifest, access/encryption metadata
├── KDNA_Core.json         # JSON envelope, encrypted ciphertext
├── KDNA_Patterns.json     # JSON envelope, encrypted ciphertext
└── KDNA_CARD.json         # Optional plaintext public card
```

### 4.3 Encryption Model

- **Profile**: `kdna-licensed-entry-v1`
- **Algorithm**: AES-256-GCM per protected entry.
- **KDF**: `scrypt-sha256` over license key + machine fingerprint.
- **Runtime rule**: decrypted plaintext MUST remain in memory and MUST NOT be written to cache as a trust source.

### 4.4 Entitlement and Activation

License activation, sync, revocation, offline grace, and audit events are
defined in `kdna-entitlement-api.md`.

The CLI/Core MVP uses:

- `license_key` + machine fingerprint as KDF input
- local activation files under `~/.kdna/licenses/`
- fail-closed checks for expired, revoked, machine-mismatched, or
  offline-grace-expired activations
- in-memory decrypt hooks only

Organization and device-fleet entitlement policies are modeled at the
Entitlement API layer, not as a separate user-facing package extension.

---

## 5. Runtime KDNA (`access: "runtime"`) — Draft

### 5.1 Description

Runtime KDNA is not distributed to clients as full judgment content. Access requires entitlement verification through KDNA Cloud or a private runtime. The client receives a projected context, not the underlying asset content.

### 5.2 Relationship to licensed `.kdna`

License policy is separate from the encryption layer:

- **Licensed `.kdna` encryption** solves: "Can this local asset be decrypted?"
- **Runtime entitlement** solves: "Is this user authorized to receive a projection?"

They can be combined: a licensed local asset may require both decryption and entitlement verification.

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
3. If encrypted, client activates a local license or receives an approved runtime projection
4. Client decrypts and loads the domain only when activation is valid
5. Offline use: license lease valid for N days (default 30). Must refresh online before expiry.
6. R2/R3 risk domains: offline lease shorter (7-14 days) or online-only.

---

## 6. Profile Comparison

| Feature | Open `.kdna` | Licensed `.kdna` | Runtime |
|---------|:---:|:---:|:---:|
| Content visible | ✅ | ❌ (encrypted) | ❌ (controlled) |
| Free to share | ✅ | ✅ (but unusable without key) | ❌ |
| Signature | Optional | Recommended | Required |
| Offline use | ✅ | ✅ (with key) | ✅ (with lease) |
| Requires account | ❌ | Optional | ✅ |
| Revocable | ❌ | Partial (key grant) | ✅ |
| Status | **Stable** | **Draft** | **Draft** |

---

## 7. Authoring vs Distribution

KDNA domains MAY be authored in dev source directories, but the `.kdna` container is the canonical asset format.

| State | Format | Purpose |
|-------|--------|---------|
| **Authoring** | Dev source directory | Git versioning, review, PR, diff, collaboration |
| **Distribution** | `.kdna` | Publishing, downloading, verifying, installing, loading, licensing |

Users should edit `.kdna` through approved KDNA editors such as KDNAStudio. Manual unpack/edit/repack is a dev-only debugging path and invalidates trust.

---

*This specification defines access profiles under the single `.kdna` asset model. Separate `.kdnae` and `.kdnal` user-facing extensions are not part of the asset-first model.*
