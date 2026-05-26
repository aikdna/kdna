# KDNA Registry CI Verification

## Overview

Every PR to `kdna-registry` must pass automated verification before merge. The registry is the trust root for the KDNA ecosystem — verification failures must block merges.

## CI Pipeline

### Trigger

- On every PR to `main` branch
- On every push to `main` (post-merge verification)
- Scheduled nightly (detect external URL drift)

### GitHub Actions Workflow

```yaml
name: Registry Validation

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: '0 4 * * *'  # Nightly at 4AM UTC

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install KDNA CLI
        run: npm install -g @aikdna/kdna-cli

      - name: Validate registry schema
        run: node scripts/validate-registry.js

      - name: Validate all domain entries
        run: node scripts/validate-registry.js --remote

      - name: Check quality badge consistency
        run: node scripts/check-quality-badges.js

      - name: Check deprecation rules
        run: node scripts/check-deprecations.js
```

## Verification Checks

### 1. Schema Validation

- `domains.json` conforms to SCHEMA.md / JSON Schema
- All required fields present for each domain
- Name format matches `@scope/domain-name` regex
- No duplicate entries
- Cluster entries have valid `cluster.domains` array
- `spec_version` is a recognized version string

### 2. Remote URL Verification (`--remote`)

For each domain entry with an `asset_url`:

- URL is reachable (HTTP 200)
- Content-type is `application/zip` or `application/octet-stream`
- Downloaded file matches declared `asset_digest`
- File is a valid ZIP archive
- Contains `kdna.json` at root
- Contains `KDNA_Core.json` and `KDNA_Patterns.json`
- Signature is valid (if `signature` field present)

### 3. Signature Verification

For each domain entry with a `signature`:

- Signature matches the scope's `trust_pubkey`
- Signature covers the content tree (excluding `signature.json`)
- Ed25519 algorithm

### 4. Quality Badge Consistency

| Rule | Check |
|------|-------|
| `quality_badge: tested` → `test_count >= 1` | Error if test_count = 0 |
| `quality_badge: validated` → `test_count >= 10` | Error if test_count < 10 |
| `quality_badge: expert_reviewed` → reviewer field present | Warning if missing |
| `quality_badge: production_ready` → `test_count >= 30` AND status = `stable` | Error if not met |
| `status: stable` + `quality_badge: untested` | Warning — shouldn't be stable if untested |

### 5. Deprecation Rules

- `deprecated: true` → `replaced_by` MUST be set
- `replaced_by` → target domain MUST exist in registry (or be a valid domain name)
- `yanked: true` → domain should not appear in default listings
- Deprecated domains with no replacement for > 90 days → warning

### 6. Scope Trust Verification

- `scopes` entries have valid `trust_pubkey` format
- `verified: true` scopes have at least one signed domain
- New scopes require manual approval (check in CI via label)

## Validation Script

```javascript
// scripts/validate-registry.js
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const REGISTRY = JSON.parse(readFileSync('domains.json', 'utf-8'));
const REMOTE = process.argv.includes('--remote');

let errors = 0;
let warnings = 0;

for (const domain of REGISTRY.domains) {
  // Schema checks
  validateSchema(domain);

  // Name format
  if (!/^@[\w-]+\/[\w-]+$/.test(domain.name)) {
    error(`${domain.name}: invalid name format`);
  }

  // Quality badge
  if (domain.quality_badge === 'tested' && domain.test_count < 1) {
    error(`${domain.name}: tested badge requires test_count >= 1`);
  }

  // Deprecation
  if (domain.deprecated && !domain.replaced_by) {
    error(`${domain.name}: deprecated domain must have replaced_by`);
  }

  // Remote checks
  if (REMOTE && domain.asset_url) {
    await verifyRemoteURL(domain);
  }
}

if (errors > 0) {
  console.error(`${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
}
```

## Nightly Checks

Additional checks run on schedule to detect drift:

1. **URL availability** — All `asset_url` values still return 200
2. **Asset digest freshness** — No `asset_digest` values silently changed upstream
3. **Scope pubkey validity** — Keys haven't been revoked
4. **New scopes** — Flag new untrusted scopes for review

## PR Blocking Rules

| Severity | Blocks Merge | Examples |
|----------|:-----------:|----------|
| **Error** | Yes | Invalid schema, asset digest mismatch, missing required fields |
| **Warning** | No | quality_badge consistency, missing optional fields |
| **Info** | No | New scope addition, version increment |

## Integration with CLI

The CI validation logic shares code with `kdna verify --registry` so users can run the same checks locally:

```bash
# Local registry validation
kdna verify --registry

# Full remote check
kdna verify --registry --remote
```
