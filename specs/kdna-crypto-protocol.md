# KDNA Crypto Protocol

## Status: Preview contract for licensed encrypted entries and entitlement checks; asset signing is withdrawn from the Preview; runtime watermarking remains a server-side design.

This document defines how `.kdna` entries are encrypted and how licensed or
remote access is authorized. It does not define an asset-signature contract.

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

### 2.3 External Signing Keys

Ed25519 keys may sign external grants, entitlement receipts, or optional Human
Lock confirmation records under those contracts. The current Preview does not
put an asset signature in the manifest, `signature.json`, `signatures/`, or a
detached sidecar. Core rejects those competing asset-signature representations
instead of silently choosing one. External signatures do not make asset content
correct or endorsed.

---

## 3. Publishing Flow (Author → Distribution Channel)

```
Authoring tool creates source workspace
    ↓
Compatible exporter writes ./dist/domain.kdna
    ↓
1. Exporter validates the source and resulting asset
2. Publisher encrypts `payload.kdnab` with a supported CBOR envelope
3. Publisher writes plaintext `kdna.json` manifest for discovery
4. Publisher computes asset digest over the `.kdna` file
5. Publisher computes canonical content digest over internal entries
    ↓
Asset distributed through any author-chosen channel:
  silver-care.kdna
  ├── kdna.json              (plaintext manifest)
  ├── payload.kdnab          (CBOR encryption envelope)
  └── checksums.json         (optional integrity records)
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
    "min_loader_version": "0.20.0",
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

## 4. Acquisition and Activation Flow

```
User obtains an exact licensed .kdna file through an author-chosen channel
and asks a compatible Host to activate that exact asset identity and digest
    ↓
1. Host validates the asset and records the user-approved attachment scope
2. Host sends an activation request to the entitlement server:
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
5. Host stores local activation metadata outside the asset through an
   appropriate protected store:
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

Published CLI versions may also expose a package-store activation workflow.
That is an exact-version implementation surface, not a protocol requirement or
an independent source of consent.

---

## 5. Load Flow (Runtime Decryption)

```
Host plans and loads the explicit file or exact user-approved attachment
    ↓
1. Runtime resolves the exact asset version and digest from the supplied file
   or attachment record
2. Runtime reads the `.kdna` file directly or from an immutable cache
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
└── checksums.json         (optional integrity records)
```

The `.kdna` asset is a ZIP container. Publishers SHOULD use stable entry order
and metadata normalization when reproducible builds are required. Core verifies
the manifest digests and, when present, `checksums.json`; it does not infer an
asset signature.

---

## 9. Identity Key Boundary

### 9.1 Key Generation

```bash
kdna identity init
```

Generates:
- `~/.kdna/identity/kdna.key` — Ed25519 private key (PEM, chmod 600)
- `~/.kdna/identity/kdna.pub` — Ed25519 public key (PEM)

This key can support external grant, license, receipt, or confirmation
contracts. It is not the buyer license secret used for local decryption, and it
does not create a Preview asset signature.

The corrective Preview CLI exposes only the identity operations in its own
current help. Legacy backup/import and rotation sketches are not part of this
protocol; secret-key recovery must not be improvised with unauthenticated
encryption.

---

## 10. Security Assumptions

1. **Distribution metadata is not content trust** — a compromised channel can
   distribute misleading metadata. Callers verify exact bytes, digests,
   checksums when present, and applicable entitlement evidence; Core does not
   endorse content.
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
- ✅ Authenticated encrypted-entry envelopes and entitlement checks
- ✅ Digest verification and optional checksum verification
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
| P6 | ~~TUF-like registry trust roles and Preview asset signing~~ | **Cancelled for this Preview.** No replacement asset-signature contract is implied. |
| P7 | `kdna.envelope.aead` canonical envelope profile (RFC-0018) | **Pre-release candidate.** Deterministic test vectors live in `conformance/envelope-aead/`; stable compatibility begins only at the first public profile release. |

---

## 13. Relationship to Existing Infrastructure

| Existing Component | Crypto Protocol Role |
|-------------------|---------------------|
| `@aikdna/kdna-core/src/crypto-profile.js` | `kdna.encryption.licensed-entry` encryption and decryption primitives |
| `@aikdna/kdna-core/src/asset-reader.js` | Direct `.kdna` reading and in-memory decrypt hooks |
| `kdna-cli/src/cmds/license.js` | Activation, sync, status, local entitlement checks |
| `kdna-cli/src/verify.js` | Direct `.kdna` structure, digest, checksum, and decrypt-hook verification |
| `specs/kdna-entitlement-api.md` | Activation, sync, revoke, offline grace, and audit API contract |
| `specs/kdna-access-modes.md` | Defines public / licensed / remote (crypto protocol references this) |
| `specs/kdna-license.md` | KCL-1.0 legal terms (crypto protocol provides technical enforcement) |
