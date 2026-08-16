# KDNA Crypto Protocol

Status: **Pre-release design and compatibility map.** The current wire-profile
candidate is defined by `kdna-crypto-profiles.md` and RFC-0018. The legacy
license-key receipt flow is compatibility code, not a recommended product
workflow or a command exposed by the current Runtime CLI source candidate.
Account/device grants are defined separately by RFC-0019. Asset signing is
withdrawn from the Preview, and runtime watermarking remains an unimplemented
server-side design.

This document defines how `.kdna` entries are encrypted and how licensed or
remote access may be authorized. It does not define an asset-signature
contract, a production entitlement service, or a stable CLI command surface.

**Design principle:** KDNA encryption does not promise "uncopyable files." It promises legitimate purchase, authorized use, leak tracing, and managed revocation. The goal is to raise the cost of unauthorized use high enough to make honest purchase the rational choice.

---

## 1. Access Modes

Every KDNA domain declares one of three access modes. The mode determines the cryptographic treatment.

| Mode | Distribution | At Rest | At Load | Revocable | Watermark |
|------|:-----------:|:-------:|:-------:|:---------:|:---------:|
| `public` | Plaintext .kdna | Plaintext | Authorized local projection | No | Optional |
| `licensed` | Licensed .kdna | Encrypted entries | Authorized in-memory decrypt through the declared entitlement profile | Policy-dependent | Not a Core requirement |
| `remote` | Never distributed | Server-side only | Authorized API projection | Policy-dependent | Product policy |

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
  encrypted KDNA entries (declared, supported envelope profile)
    ↓
  CEK unwrapped in memory from an authorized password, receipt, account,
  organization, or device grant
    ↓
  non-secret entitlement metadata outside the asset; secrets in SecretStore
```

### 2.1 Content Encryption Key

- **Type:** profile-defined symmetric CEK; RFC-0018 uses a random 256-bit CEK.
- **Source:** unwrapped through the exact key-slot or external-grant contract
  declared by the asset. A password slot uses its declared KDF. Account and
  organization profiles use RFC-0019 external grants and do not fall back to a
  password or legacy receipt.
- **Scope:** used only to decrypt protected entries in memory.
- **Persistence:** MUST NOT be written to disk, logged, embedded in traces, or
  returned to an Agent-facing consumer.

### 2.2 License Key

- **Format:** `KDNA-LIC-...` opaque activation key.
- **Purpose:** Legacy bearer credential for the
  `kdna.encryption.licensed-entry` compatibility profile.
- **Storage:** MUST NOT be present in plaintext activation JSON, argv,
  environment variables, logs, traces, reports, or `.kdna` assets. A product
  that still supports this compatibility profile retrieves the credential from
  an approved SecretStore or one-time protected input channel and passes only
  a scoped in-memory decrypt hook to Core.

### 2.3 External Signing Keys

Ed25519 keys may sign external grants, entitlement receipts, or optional Human
Lock confirmation records under those contracts. Asset signatures have exactly
one canonical representation: the optional top-level `signature.kdsig` bundle
entry defined by RFC-0021 M1 (`kdsig.ed25519`). The manifest `signature` /
`signatures` fields, `signature.json`, `signatures/`, and detached sidecars
remain rejected competing representations instead of being silently chosen.
External signatures do not make asset content correct or endorsed.

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

## 4. Acquisition and Authorization Flow

```
User obtains an exact licensed .kdna file through an author-chosen channel
and asks a compatible Host to authorize that exact asset identity and digest
    ↓
1. Host validates the asset and records the user-approved attachment scope
2. Product adapter obtains the credential or device proof from a protected
   input channel and sends the profile-specific request to the configured issuer
    ↓
3. Server validates purchase, status, expiration, limits, and binding policy
4. Server returns a signed receipt or external grant bound to the asset and
   subject/device as required by the profile
    ↓
5. Host stores only non-secret status metadata outside the asset and places
   replayable credentials or private keys in an approved SecretStore:
   {
     "license_id": "lic_abc123",
     "domain": "@scope/silver-care",
     "status": "active",
     "secret_ref": "implementation-defined-private-reference",
     "offline_valid_until": "2026-06-03T00:00:00.000Z"
   }
```

The experimental legacy request/response contract is documented in
`kdna-entitlement-api.md`. Account/device grants use RFC-0019. Neither document
creates a production hosted service or adds activation commands to the current
Runtime CLI source candidate.

---

## 5. Load Flow (Runtime Decryption)

```
Host plans and loads the explicit file or exact user-approved attachment
    ↓
1. Runtime resolves the exact asset version and digest from the supplied file
   or attachment record
2. Runtime reads the `.kdna` file directly or from an immutable cache
3. Product adapter checks the declared entitlement profile: not expired or
   revoked, bindings match, and any offline lease is valid
4. Product adapter retrieves the required secret or grant through SecretStore
   and supplies a scoped in-memory decrypt hook
5. Core decrypts protected entries in memory only
6. Runtime projects the requested profile into a Runtime Capsule
7. Agent receives the Capsule, never the raw payload or encryption envelope
8. Runtime logs audit metadata without license_key or decrypted content
    ↓
Plaintext KDNA NEVER touches disk.
```

---

## 6. Revocation Flow

```
Entitlement issuer revokes the subject's entitlement
    ↓
Server updates license status → revoked
Authorized product adapter refreshes the signed status or grant
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

## 7. Watermark Design Boundary

Watermarking, if a product adopts it, is an accountability layer above Core
decryption. Core and the current Runtime CLI do not promise or require output
watermarking. A remote product may define a separately disclosed watermark
policy, but must not imply that the KDNA protocol makes a file copy-proof or
that all licensed output is traceable.

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
the manifest digests and, when present, `checksums.json`; when present, the
`signature.kdsig` bundle is verified fail-closed under RFC-0021 M1.

---

## 9. Identity Key Boundary

External grants and signed receipts may use issuer or device signing keys under
their own contracts. Their private keys belong in SecretStore and are not KDNA
asset content. The published CLI `0.35.1` identity commands are a historical
implementation surface; the current corrective Runtime CLI source candidate
does not expose an identity command. Asset signatures are governed by RFC-0021
M1 (`kdsig.ed25519`), which is separate from both CLI identity surfaces.

---

## 10. Security Assumptions

1. **Distribution metadata is not content trust** — a compromised channel can
   distribute misleading metadata. Callers verify exact bytes, digests,
   checksums when present, and applicable entitlement evidence; Core does not
   endorse content.
2. **Legacy license keys are bearer secrets** — if leaked, a license may be
   abused until revoked or re-bound. Mitigation includes SecretStore, scoped
   one-time input, short offline leases, device proof, refresh, and audit.
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
- ✅ A boundary for product-specific leak accountability when separately enabled
- ✅ Fail-closed revocation handling when an authorized adapter supplies current evidence
- ✅ Clear separation of public / licensed / remote modes
- ✅ License keys excluded from audit logs and traces

---

## 12. Implementation Roadmap

| Phase | What | Prerequisite |
|-------|------|-------------|
| P0 | Spec this document | Done |
| P1 | `kdna.encryption.licensed-entry` compatibility primitives | Present in source; legacy compatibility, not the target export profile |
| P2 | Direct `.kdna` reader with in-memory decrypt hook | Present in Core source |
| P3 | Legacy activation/sync implementation | Retained as non-routable source compatibility code; not a current CLI command |
| P4 | Entitlement revoke/admin API | Experimental server contract; no hosted production service is promised |
| P5 | Runtime projection and watermark service | Future server implementation |
| P6 | ~~TUF-like registry trust roles and Preview asset signing~~ | **Cancelled for this Preview.** No replacement asset-signature contract is implied. |
| P7 | `kdna.envelope.aead` canonical envelope profile (RFC-0018) | **Pre-release candidate.** Deterministic test vectors live in `conformance/envelope-aead/`; stable compatibility begins only at the first public profile release. |

---

## 13. Relationship to Existing Infrastructure

| Existing Component | Crypto Protocol Role |
|-------------------|---------------------|
| `@aikdna/kdna-core/src/crypto-profile.js` | `kdna.encryption.licensed-entry` encryption and decryption primitives |
| `@aikdna/kdna-core/src/asset-reader.js` | Direct `.kdna` reading and in-memory decrypt hooks |
| `kdna-cli/src/cmds/license.js` | Non-routable legacy compatibility implementation; not a current CLI command |
| `kdna-cli/src/verify.js` | Direct `.kdna` structure, digest, checksum, and decrypt-hook verification |
| `specs/kdna-entitlement-api.md` | Activation, sync, revoke, offline grace, and audit API contract |
| `specs/kdna-secret-store.md` | Storage boundary for replayable credentials and device keys |
| `rfcs/RFC-0019-account-device-external-key-grant.md` | Account/device external-key grant contract |
| `specs/kdna-access-modes.md` | Defines public / licensed / remote (crypto protocol references this) |
| `specs/kdna-license.md` | KCL-1.0 legal terms (crypto protocol provides technical enforcement) |
