# KDNA Enterprise Deployment Guide

This guide covers deploying KDNA in environments where the public registry is inaccessible or insufficient — private registries, self-signed domains, air-gapped installations, and enterprise key management.

## 1. Private Registry

Host a private KDNA registry on any static file server (GitHub Pages, internal GitLab, S3, etc.):

### 1.1 Create a private registry

```bash
# Create your registry directory
mkdir my-registry

# Copy the registry schema
cp path/to/kdna-registry/SCHEMA.md my-registry/

# Create your domains.json with scope configuration
cat > my-registry/domains.json << 'EOF'
{
  "registry_version": "1.0-rc",
  "schema_version": "2.0",
  "updated": "2026-05-22T00:00:00Z",
  "scopes": {
    "@mycorp": {
      "type": "scoped",
      "trust_pubkey": "ed25519:your-corp-key-fingerprint",
      "registry_url": "https://mycorp.internal/kdna-registry/domains.json",
      "verified": true
    }
  },
  "domains": [
    {
      "name": "@mycorp/internal_review",
      "version": "0.1.0",
      "spec_version": "1.0-rc",
      "status": "validated",
      "access": "licensed",
      "file_count": 6,
      "domain_field": ["software-engineering"],
      "judgment_patterns": ["quality-assessment"],
      "description": "Internal code review standards for MyCorp",
      "core_insight": "Our review process prioritizes security impact over style compliance.",
      "keywords": ["code review", "security", "mycorp internal"],
      "asset_url": "https://mycorp.internal/packages/internal_review-0.1.0.kdna",
      "asset_digest": "sha256:..."
    }
  ]
}
EOF
```

### 1.2 Configure CLI to use private registry

```bash
# Point KDNA to your private registry
export KDNA_REGISTRY_URL="https://mycorp.internal/kdna-registry/domains.json"

# Or configure permanently
mkdir -p ~/.kdna
cat > ~/.kdna/config.json << 'EOF'
{
  "registries": {
    "@mycorp": {
      "url": "https://mycorp.internal/kdna-registry/domains.json"
    }
  }
}
EOF
```

### 1.3 Mixed public/private registries

The CLI supports routing different scopes to different registries:

```json
{
  "registries": {
    "@mycorp": {
      "url": "https://mycorp.internal/kdna-registry/domains.json"
    },
    "@partner": {
      "url": "https://partner.example.com/kdna/domains.json"
    }
  }
}
```

Scopes not configured fall back to the canonical public registry at `@aikdna`.

---

## 2. Self-Signed Domains

Sign KDNA domains with your organization's Ed25519 key instead of the `@aikdna` team key.

### 2.1 Generate an organization identity

```bash
kdna identity init --org "MyCorp"
# Generates: ~/.kdna/identity/mycorp.json
#   - Ed25519 private key (AES-256-CBC encrypted)
#   - Public key fingerprint
#   - buyer_id for licensing
```

### 2.2 Show your public key

```bash
kdna identity show
# Output:
#   Buyer ID:      mycorp-abc123
#   Pubkey:        ed25519:43d22af8...
#   Registered:    yes (in ~/.kdna/config.json)
```

### 2.3 Publish a Studio-compiled asset

```bash
kdna publish ./dist/my_domain.kdna
# 1. Reads an existing .kdna asset
# 2. Checks authoring provenance for trusted quality claims
# 3. Computes asset/content digests
# 4. Outputs registry patch JSON
```

### 2.4 Verify trust on the consumer side

When consumers install domains from your scope, the CLI verifies:
1. `kdna.json` manifest's `author.pubkey` matches your scope's `trust_pubkey` in the registry
2. Ed25519 signature over the canonical payload is valid
3. Embedded `public_key_pem` hashes to the claimed `author.pubkey`

No additional configuration is required. The registry entry's `trust_pubkey` field anchors the trust chain.

---

## 3. Air-Gap Installation

Deploy KDNA domains in environments without internet access.

### 3.1 Prepare on an internet-connected machine

```bash
# Install domains from any registry
kdna install @aikdna/code_review
kdna install @aikdna/agent_safety

# Copy installed .kdna assets from ~/.kdna/packages/ for transport

# Or export a trusted offline asset from Studio
kdna-studio export ./my_internal_project --out ./offline-packages/my_internal_domain.kdna --sign
kdna verify ./offline-packages/my_internal_domain.kdna
```

### 3.2 Transport and install on air-gapped machine

```bash
# Copy the .kdna files to the air-gapped machine via USB/storage
# On the air-gapped machine:

# Install kdna CLI (transfer the npm package or build from source)
npm install -g ./kdna-0.7.8.tgz

# Install kdna-loader skill from bundled copy (no network needed)
kdna setup

# Install domains from local files
kdna install ./offline-packages/code_review-0.1.0.kdna
kdna install ./offline-packages/agent_safety-0.7.6.kdna
kdna install ./offline-packages/my_internal_domain-0.1.0.kdna

# Verify installations
kdna list
kdna verify @aikdna/code_review
```

### 3.3 Local registry for air-gapped environments

```bash
# Host a local registry file on a shared drive
mkdir -p /mnt/shared/kdna-registry

# Copy your offline packages and registry manifest
cp ./offline-packages/*.kdna /mnt/shared/kdna-registry/packages/
cat > /mnt/shared/kdna-registry/domains.json << 'EOF'
{
  "registry_version": "1.0-rc",
  "schema_version": "2.0",
  "updated": "2026-05-22T00:00:00Z",
  "scopes": {},
  "domains": [
    {
      "name": "@aikdna/code_review",
      "version": "0.1.0",
      "asset_url": "file:///mnt/shared/kdna-registry/packages/code_review-0.1.0.kdna",
      "asset_digest": "sha256:...",
      "...": "full domain metadata"
    }
  ]
}
EOF

# Configure machines to use the shared registry
export KDNA_REGISTRY_URL="file:///mnt/shared/kdna-registry/domains.json"
```

---

## 4. Enterprise Key Management

### 4.1 Key backup

```bash
kdna identity export --out ~/backup/mycorp-identity.backup
# Prompts for a passphrase
# Output: AES-256-CBC encrypted backup file
```

### 4.2 Key rotation

```bash
# 1. Generate new key pair
kdna identity init --org "MyCorp-v2"

# 2. Re-sign all domains with new key
kdna publish ./dist/my_domain_1.kdna
kdna publish ./dist/my_domain_2.kdna

# 3. Update registry with new trust_pubkey
# Update domains.json: scopes.@mycorp.trust_pubkey = new fingerprint

# 4. Optionally revoke old key
# Update domains.json: scopes.@mycorp.revoked_pubkeys = ["ed25519:old-fingerprint"]
```

### 4.3 Multi-key signing (organization with multiple signers)

```json
// In your registry domains.json:
{
  "scopes": {
    "@mycorp": {
      "type": "scoped",
      "trust_pubkey": "ed25519:primary-fingerprint",
      "delegated_pubkeys": [
        "ed25519:ci-fingerprint",
        "ed25519:reviewer-fingerprint"
      ]
    }
  }
}
```

Domain assets signed by any delegated key are accepted by the CLI when the scope is `@mycorp`.

---

## 5. Security Architecture

### Trust Model

```
Registry (domains.json)
  │
  ├─ Scope: @mycorp
  │   ├─ trust_pubkey: "ed25519:fp-aaaa"
  │   └─ registry_url: "https://mycorp.internal/..."
  │
  └─ Domain: @mycorp/internal_review
      ├─ asset_url: .kdna asset download location
      ├─ asset_digest: whole-file asset integrity hash
      └─ signature: Ed25519 sig (stored in kdna.json inside the .kdna)
          └─ Verified against trust_pubkey on install
```

### Verification Chain

1. **Registry → Asset**: Registry entry declares `asset_digest` → downloaded `.kdna` must match
2. **Domain → Author**: `kdna.json` declares `author.pubkey` → must match scope `trust_pubkey`
3. **Author → Content**: `kdna.json` carries Ed25519 `signature` → verified against canonical payload
4. **PEM → Pubkey**: Embedded `public_key_pem` hashes to `author.pubkey` → prevents fingerprint spoofing

---

## 6. CI/CD Integration

### GitHub Actions: Validate on PR

```yaml
name: Validate KDNA Domain
on:
  pull_request:
    paths: ['my_domain/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @aikdna/kdna-cli
      - run: kdna dev validate my_domain
      - run: kdna publish --check my_domain  # quality gate
```

### Automated publishing

```bash
#!/bin/bash
# publish-on-release.sh — run from CI when a version tag is pushed

set -e

DOMAIN_PATH="$1"
VERSION="${2:-$(node -p "require('./$DOMAIN_PATH/kdna.json').version")}"
REPO="${GITHUB_REPOSITORY}"

kdna publish "$DOMAIN_PATH" \
  --release-tag "v$VERSION" \
  --repo "$REPO"

echo "Published $REPO@v$VERSION"
echo "Registry patch JSON written to stdout — append to your domains.json"
```

---

## 7. Open vs. Licensed Assets

KDNA supports both open judgment assets and licensed/private judgment assets. Open assets remain the default path for community adoption, while licensed `.kdna` profiles and licenses support professional and enterprise distribution.

- **Open assets** (`@aikdna/*`, community scopes): freely installable, auditable, and composable
- **Licensed assets** (`.kdna` with `access: "licensed"`): require a valid license for in-memory decryption
- **Enterprise private assets**: hosted on private registries with organization-scoped signing keys

When evaluating KDNA for your organization, start with open domains to validate the protocol and tooling. Introduce licensed or private domains when you need to protect proprietary judgment assets or enforce usage boundaries.

---

## 8. Troubleshooting

### "Network unavailable and no cache"

The CLI cannot reach the registry URL. Solutions:
- Check your network / VPN connection
- Pre-populate the cache: copy `domains.json` to `~/.kdna/registry/domains.json`
- Use `KDNA_REGISTRY_URL` to point to an accessible mirror

### "Domain signature INVALID"

The `.kdna` package has been tampered with or the trust key is misconfigured. Solutions:
- Redownload from the canonical source
- Verify `trust_pubkey` in your registry matches the domain author's key
- If the author rotated their key, update your registry reference

### "Scope not registered in registry"

You are trying to install a domain from a scope that is not in any configured registry. Solutions:
- Add the scope to your `~/.kdna/config.json` registries
- Use `kdna install ./file.kdna` for local packages not in any registry
