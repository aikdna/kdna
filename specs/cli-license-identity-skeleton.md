# KDNA CLI — License & Identity Commands (Skeleton Design)

Version: 0.1
Status: Draft

## 1. Purpose

Define the minimal CLI command set for KDNA license management and creator identity, supporting the commercial asset lifecycle: create identity → sign assets → verify signatures → check license status → install with license.

## 2. Identity Commands

### 2.1 `kdna identity init`

Initialize a creator identity keypair.

```
kdna identity init [--name "Creator Name"] [--email "creator@example.com"]

Creates:
  ~/.kdna/identity/keypair.json       # Private key (encrypted at rest)
  ~/.kdna/identity/public.json        # Public key + identity metadata
```

Output:
```
Identity created:
  ID:        creator-abc123
  Name:      Creator Name
  Public key: ed25519:abcd1234...
  
  Next: kdna identity export > my-identity.pub
        (Share this with registries to verify your signatures)
```

### 2.2 `kdna identity show`

Display current identity information.

```
kdna identity show

Output:
  ID:        creator-abc123
  Name:      Creator Name
  Public key: ed25519:abcd1234...
  Created:   2026-05-24
  Domains signed: 3
```

### 2.3 `kdna identity export`

Export public identity information (for registry registration).

```
kdna identity export [--format json|pem]

Output (json):
{
  "id": "creator-abc123",
  "name": "Creator Name",
  "pubkey": "ed25519:abcd1234...",
  "created": "2026-05-24"
}
```

## 3. Signing Commands

### 3.1 `kdna publish <file.kdna>`

Publish an existing Studio-compiled `.kdna` asset through the legacy publish
surface. `kdna publish` does not create provenance, signature, quality, or
endorsement claims from arbitrary source directories.

```
kdna publish ./dist/my-domain.kdna

Output:
  Signed: @aikdna/my-domain 0.1.0
  Signature: ed25519:def5678...
  Asset: ./dist/my-domain.kdna
```

Pre-flight checks:
- Identity must be initialized (`kdna identity init`)
- Source directory must pass `kdna dev validate`
- Source directory must have complete metadata (author, license, version)
- The published asset is the `.kdna` file; the source directory is dev-only

### 3.2 `kdna verify <domain>`

Verify a domain's signature against the author's public key.

```
kdna verify @aikdna/writing        # Verify installed domain
kdna verify ./my-domain.kdna       # Verify a .kdna asset

Output (valid):
  ✓ Signature valid
    Signed by: KDNA Team (kdna-team)
    Public key: ed25519:43d22af8...
    Signed at: 2026-05-22T10:30:00Z

Output (invalid):
  ✗ Signature verification failed
    Expected: ed25519:43d22af8...
    Got:      ed25519:different...
```

## 4. License Commands

### 4.1 `kdna license show <domain>`

Display license information for a domain.

```
kdna license show @aikdna/writing

Output:
  License:    CC-BY-4.0
  URL:        https://creativecommons.org/licenses/by/4.0/
  Commercial: No
  Agent use:  Allowed
  Redistribution: Allowed (with attribution)
  Training:   Not allowed
```

For commercial domains:
```
kdna license show @aikdna/writing-pro

Output:
  License:    KCL-1.0 (KDNA Commercial License 1.0)
  URL:        https://aikdna.com/licenses/KCL-1.0
  Commercial: Yes
  Agent use:  Allowed (with valid license)
  Redistribution: Prohibited
  Training:   Prohibited
  Subscription: one_time / $X
  Status:      Valid until 2027-05-24
```

### 4.2 `kdna license status`

Check license status for all installed domains.

```
kdna license status

Output:
  @aikdna/writing          CC-BY-4.0      Open        Active
  @aikdna/writing-pro      KCL-1.0        Licensed    Active (expires 2027-05-24)
  @aikdna/management-pro   KCL-1.0        Licensed    Expired (2026-04-01)
  @aikdna/agent_safety     CC-BY-4.0      Open        Active
```

### 4.3 `kdna license activate <domain> --key <license-key> --server <url>`

Activate a commercial license for a domain.

```
kdna license activate @aikdna/writing-pro \
  --key KDNA-LIC-XXXX-YYYY-ZZZZ \
  --server https://license.example.com/entitlements/activate

Output:
  License activated: @aikdna/writing-pro
  Type:    Personal License
  Valid until: 2027-05-24
  Agents:  3
```

The activation/sync contract is defined in `kdna-entitlement-api.md`.

## 5. Licensed and Runtime Installation

### 5.1 Licensed `.kdna` flow

Licensed assets are installed as immutable `.kdna` files first, then activated
through the entitlement API. The license key is not passed to `kdna install`.

```
kdna install @aikdna/writing-pro
kdna license activate @aikdna/writing-pro \
  --key KDNA-LIC-XXXX-YYYY-ZZZZ \
  --server https://license.example.com/entitlements/activate

Behavior:
1. Fetch domain metadata from registry
2. Download `.kdna` asset
3. Verify digest and signature against registry trust metadata
4. Install immutable asset to ~/.kdna/packages/@aikdna/writing-pro/<version>/writing-pro-<version>.kdna
5. Store activation metadata outside the asset in ~/.kdna/licenses/
6. Load only when activation checks pass
```

### 5.2 `kdna install <domain> --runtime`

Install a runtime-mode domain (projection only, no local files).

```
kdna install @aikdna/management-pro --runtime

Behavior:
1. Fetch domain metadata from registry
2. Verify subscription status with runtime endpoint
3. Store runtime endpoint config in ~/.kdna/runtime/
4. No local domain files stored (projection is remote)
```

## 6. Implementation Priority

| Command | Phase | Dependencies |
|---------|-------|-------------|
| `kdna identity init` | Phase 2 (Week 5-6) | crypto key generation |
| `kdna identity show` | Phase 2 (Week 5-6) | identity init |
| `kdna sign` | Phase 2 (Week 7-8) | identity init, validate |
| `kdna verify` | Phase 2 (Week 7-8) | existing signatures in registry |
| `kdna license show` | Phase 2 (Week 7-8) | license fields in kdna.json |
| `kdna license status` | Phase 3 (Week 9-12) | multiple installed domains |
| `kdna license activate` | CLI MVP implemented | Entitlement API activation endpoint |
| `kdna license sync` | CLI MVP implemented | Entitlement API sync endpoint |
| `kdna install --runtime` | Phase 3 (Week 9-12) | runtime endpoint |

---

*This CLI skeleton defines the command surface. Actual implementation depends on the `kdna-cli` codebase (published as `@aikdna/kdna-cli` via npm).*
