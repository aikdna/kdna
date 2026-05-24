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

### 3.1 `kdna sign <domain-path>`

Sign a domain package with the creator's identity key.

```
kdna sign ./my-domain        # Sign a local domain directory
kdna sign ./my-domain.kdna   # Sign a .kdna package file

Output:
  Signed: @aikdna/my-domain v0.1.0
  Signature: ed25519:def5678...
  Written to: ./my-domain/kdna.json (signature field)
```

Pre-flight checks:
- Identity must be initialized (`kdna identity init`)
- Domain must pass `kdna validate`
- Domain must have complete metadata (author, license, version)

### 3.2 `kdna verify <domain>`

Verify a domain's signature against the author's public key.

```
kdna verify @aikdna/writing        # Verify installed domain
kdna verify ./my-domain.kdna       # Verify a .kdna package

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
  @aikdna/decision_state   CC-BY-4.0      Open        Active
```

### 4.3 `kdna license activate <domain> --key <license-key>`

Activate a commercial license for a domain.

```
kdna license activate @aikdna/writing-pro --key KDNA-LIC-XXXX-YYYY-ZZZZ

Output:
  License activated: @aikdna/writing-pro
  Type:    Personal License
  Valid until: 2027-05-24
  Agents:  3
```

## 5. Install with License

### 5.1 `kdna install <domain> --license <key>`

Install a licensed (commercial) domain.

```
kdna install @aikdna/writing-pro --license KDNA-LIC-XXXX

Behavior:
1. Fetch domain metadata from registry
2. Verify license key with license server
3. Download domain package
4. Verify signature against author's public key
5. Install to ~/.kdna/domains/@aikdna/writing-pro/
6. Store license key in ~/.kdna/licenses/
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
| `kdna license activate` | Phase 3 (Week 9-12) | license server / validation endpoint |
| `kdna install --license` | Phase 3 (Week 9-12) | license activation flow |
| `kdna install --runtime` | Phase 3 (Week 9-12) | runtime endpoint |

---

*This CLI skeleton defines the command surface. Actual implementation depends on the `kdna-cli` codebase (published as `@aikdna/kdna-cli` via npm).*
