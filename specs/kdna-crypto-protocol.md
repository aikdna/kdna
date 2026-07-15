# KDNA Crypto Protocol

## Status: CLI/Core MVP implemented for licensed encrypted entries; runtime watermarking remains a server-side design.

This document defines how .kdna files are encrypted, signed, licensed, and verified — the cryptographic infrastructure for KDNA as a tradeable judgment asset.

**Design principle:** KDNA encryption does not promise "uncopyable files." It promises legitimate purchase, authorized use, leak tracing, and managed revocation. The goal is to raise the cost of unauthorized use high enough to make honest purchase the rational choice.

---

## 1. Access Modes

Every KDNA domain declares one of three access modes. The mode determines the cryptographic treatment.

| Mode | Distribution | At Rest | At Load | Revocable | Watermark |
|------|:-----------:|:-------:|:-------:|:---------:|:---------:|
| `public` | Plaintext .kdna | Plaintext | Authorized local projection | No | Optional |
| `licensed` | Licensed .kdna | Encrypted entries | Local in-memory decrypt with license key | Yes | Required |
| `remote` | Never distributed | Server-side only | API projection | Yes | Required |

**Public mode** requires no secrecy but Agent consumption still goes through
LoadPlan and Runtime Capsule. This document focuses on `licensed` and `remote`.

---

## 2. Key Architecture

KDNA uses a single asset model with encrypted internal entries. The `.kdna`
container remains the canonical asset. The container is never password-protected
as a whole.

```
licensed .kdna asset
    ↓
  encrypted KDNA entries (AES-256-GCM envelopes)
    ↓
  entry decrypt key derived from license_key + machine_fingerprint
    ↓
  local activation metadata outside the asset
```

### 2.1 Entry Decrypt Key

- **Type:** 256-bit symmetric key derived with `scrypt-sha256`.
- **Inputs:** `license_key`, `machine_fingerprint`, and the encrypted-entry
  profile salt.
- **Scope:** Used only to decrypt protected entries in memory.
- **Persistence:** MUST NOT be written to disk, logged, or embedded in traces.

### 2.2 License Key

- **Format:** `KDNA-LIC-...` opaque activation key.
- **Purpose:** Proves the buyer can activate the asset and derives the local
  decrypt hook for `kdna.encryption.licensed-entry`.
- **Storage:** MAY be present in the local activation file when required for
  offline licensed loading, but MUST NOT be printed, logged, included in audit
  events, or embedded in `.kdna` assets.

### 2.3 Author and Publisher Signing Keys

- **Type:** Ed25519.
- **Purpose:** Bind published asset bytes and metadata to a signing key.
- **Trust source:** The `.kdna` file and its detached/declared signature are the
  signed object. A catalog may repeat digest/signature metadata, but Core does
  not turn catalog presence or a valid signature into content endorsement.

---

## 3. Publishing Flow (Author → Distribution Channel)

```
Author creates source workspace
    ↓
kdna publish --access licensed --output ./dist/domain.kdna
    ↓
1. Publisher validates source workspace
2. Publisher encrypts `payload.kdnab` with a supported CBOR envelope
3. Publisher writes plaintext `kdna.json` manifest for discovery
4. Publisher computes asset digest over the `.kdna` file
5. Publisher computes canonical content digest over internal entries
6. Publisher signs published metadata with the author identity
    ↓
Asset distributed through any author-chosen channel:
  silver-care.kdna
  ├── kdna.json              (plaintext manifest, signed)
  ├── payload.kdnab          (CBOR encryption envelope)
  ├── checksums.json         (optional integrity records)
  └── signatures/            (optional provenance signatures)
```

### 3.1 Package Manifest

```json
{
  "kdna_version": "1.0",
  "asset_id": "kdna:example:silver-care",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Silver Care",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "created_at": "2026-07-01T00:00:00.000Z",
  "updated_at": "2026-07-01T00:00:00.000Z",
  "creator": { "name": "Example Author" },
  "compatibility": {
    "min_loader_version": "0.15.12",
    "profile": "kdna.payload.judgment"
  },
  "payload": {
    "path": "payload.kdnab",
    "encoding": "cbor",
    "encrypted": true
  },
  "access": "licensed",
  "encryption": {
    "profile": "kdna.envelope.aead",
    "encrypted_entries": ["payload.kdnab"]
  }
}
```

---

## 4. Purchase Flow (Buyer → Distribution/Entitlement Service → Local)

```
Buyer installs and activates:
  kdna install @scope/silver-care
  kdna license activate @scope/silver-care --key KDNA-LIC-... --server <activate-url>
    ↓
1. CLI installs immutable `.kdna` under ~/.kdna/packages/
2. CLI sends activation request to entitlement server:
   {
     "domain": "@scope/silver-care",
     "license_key": "KDNA-LIC-...",
     "machine_fingerprint": "sha256:...",
     "client": "kdna-cli"
   }
    ↓
3. Server validates purchase, status, expiration, limits, and binding policy
4. Server returns activation object
    ↓
5. CLI stores local activation metadata outside the asset:
   {
     "license_id": "lic_abc123",
     "license_key": "KDNA-LIC-...",
     "domain": "@scope/silver-care",
     "status": "active",
     "machine_fingerprint": "sha256:...",
     "offline_valid_until": "2026-06-03T00:00:00.000Z"
   }
```

The production request/response contract is defined in
`kdna-entitlement-api.md`.

---

## 5. Load Flow (Runtime Decryption)

```
Agent triggers: kdna load @scope/silver-care
    ↓
1. Runtime resolves installed asset from ~/.kdna/index.json
2. Runtime reads the `.kdna` file directly
3. Runtime checks local activation: not expired, not revoked, domain matches,
   machine binding matches, and offline grace is valid
4. Runtime derives decrypt hook from license_key + machine_fingerprint
5. Runtime decrypts protected entries in memory only
6. Runtime projects the requested profile into a Runtime Capsule
7. Agent receives the Capsule, never the raw payload or encryption envelope
8. Runtime logs audit metadata without license_key or decrypted content
    ↓
Plaintext KDNA NEVER touches disk.
```

---

## 6. Revocation Flow

```
Entitlement server revokes buyer's license
    ↓
Server updates license status → revoked
kdna CLI periodically syncs (kdna license sync)
    ↓
Next load attempt:
  License status: revoked
  Runtime refuses to decrypt
  Audit log records revocation check
```

Offline grace period is declared by the activation response. After grace expires
without a successful sync, license loading fails closed until the next successful
sync.

---

## 7. Watermark Policy

Watermarking is an accountability layer above local decryption. Runtime KDNA
SHOULD include server-side watermark traces. Licensed local KDNA MAY include
watermark policy in the asset or entitlement response, but watermarking is not
required for the CLI/Core encrypted-entry MVP.

| Mode | Watermark Content | Injection Point |
|------|------------------|----------------|
| `licensed` | buyer_id + license_id + timestamp | Encoded in response text (zero-width marker) |
| `remote` | buyer_id + call_id + timestamp | Encoded in API response |

If a watermarked response appears publicly, an author or entitlement operator can:
1. Extract watermark → identify buyer
2. Issue warning
3. Revoke license if repeated

This is NOT DRM. It is **leak accountability**: the buyer knows their identity
or license identifier may be traceable in authorized projections or responses.

---

## 8. Licensed `.kdna` Format

The licensed `.kdna` file keeps the single asset extension and the same
container shape. `payload.kdnab` is a CBOR envelope under a supported profile:

```
silver-care-1.0.0.kdna
├── mimetype               (plaintext media type)
├── kdna.json              (plaintext manifest)
├── payload.kdnab          (CBOR encrypted-entry envelope)
├── checksums.json         (optional integrity records)
└── signatures/            (optional provenance signatures)
```

The `.kdna` asset is a ZIP container. Publishers SHOULD use stable entry order
and metadata normalization when reproducible builds are required, but the signed
asset digest remains the source of truth.

---

## 9. Publisher Identity Key Management

### 9.1 Key Generation

```bash
kdna identity init
```

Generates:
- `~/.kdna/identity/kdna.key` — Ed25519 private key (PEM, chmod 600)
- `~/.kdna/identity/kdna.pub` — Ed25519 public key (PEM)

This identity signs published asset metadata. It is not the buyer license secret
used for local decryption.

### 9.2 Key Backup

```bash
kdna identity export --output kdna-identity-backup.age
```

Encrypts the private key with a user-provided passphrase (age encryption).

### 9.3 Key Rotation

```bash
kdna identity rotate
```

Generates a new publisher key pair. Existing assets remain bound to the old
key. Whether a caller continues to trust or revokes that key is caller-owned
policy, not a Core endorsement.

---

## 10. Security Assumptions

1. **Distribution metadata is not content trust** — a compromised catalog or
   publisher key can distribute misleading metadata. Callers verify bytes and
   signatures and apply their own key policy; Core does not endorse content.
2. **License keys are bearer secrets** — if leaked, a license may be abused until revoked or re-bound. Mitigation: machine binding, short offline leases, sync, and audit.
3. **Plaintext exists in agent context** — any agent that uses local licensed KDNA can receive plaintext fragments in context. This is unavoidable. The defense is activation, projection, audit, and licensing, not absolute prevention.
4. **Offline use is policy-controlled** — `licensed` mode works offline only until `offline_valid_until`. This is a business decision, not a crypto limitation.

---

## 11. What This Protocol Does NOT Promise

- ❌ "No one can ever see the plaintext"
- ❌ "Copy-proof files"
- ❌ "Unbreakable encryption"
- ❌ "Replaces legal agreements"

What it DOES provide:
- ✅ Legitimate purchase mechanism with cryptographic proof
- ✅ Tamper-evident packages (signature verification)
- ✅ Leak accountability when runtime watermarking is enabled
- ✅ Managed revocation through entitlement sync
- ✅ Clear separation of public / licensed / remote modes
- ✅ License keys excluded from audit logs and traces

---

## 12. Implementation Roadmap

| Phase | What | Prerequisite |
|-------|------|-------------|
| P0 | Spec this document | Done |
| P1 | `kdna.encryption.licensed-entry` encrypted-entry profile | CLI/Core MVP implemented |
| P2 | Direct `.kdna` reader with in-memory decrypt hook | CLI/Core MVP implemented |
| P3 | `kdna license activate` and `kdna license sync` | CLI MVP implemented |
| P4 | Entitlement revoke/admin API | Specified |
| P5 | Runtime projection and watermark service | Future server implementation |
| P6 | ~~TUF-like registry trust roles~~ | **Cancelled.** Per-author Ed25519 identity replaces registry-owned trust roles. |
| P7 | `kdna.envelope.aead` canonical envelope profile (RFC-0018) | **Accepted.** Test vectors live in `conformance/envelope-aead/`; release-specific implementation maturity is tracked in public status and release notes. |

---

## 13. Relationship to Existing Infrastructure

| Existing Component | Crypto Protocol Role |
|-------------------|---------------------|
| `@aikdna/kdna-core/src/crypto-profile.js` | `kdna.encryption.licensed-entry` encryption and decryption primitives |
| `@aikdna/kdna-core/src/asset-reader.js` | Direct `.kdna` reading and in-memory decrypt hooks |
| `kdna-cli/src/cmds/license.js` | Activation, sync, status, local entitlement checks |
| `kdna-cli/src/verify.js` | Direct `.kdna` verification with optional decrypt hook |
| `specs/kdna-entitlement-api.md` | Activation, sync, revoke, offline grace, and audit API contract |
| `specs/kdna-access-modes.md` | Defines public / licensed / remote (crypto protocol references this) |
| `specs/kdna-license.md` | KCL-1.0 legal terms (crypto protocol provides technical enforcement) |
