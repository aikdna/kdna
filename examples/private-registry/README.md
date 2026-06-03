# Private Registry Demo

This example shows the minimum private registry shape for an organization-owned KDNA scope.

## Goal

An operator should be able to:

1. Host a static `domains.json`.
2. Point the CLI at it with `KDNA_REGISTRY_URL`.
3. Install only assets whose digest and trust metadata match.
4. Fail closed for yanked, expired, revoked, missing-trust, or digest-mismatched entries.

## Files

- `domains.json`: static registry snapshot with one scoped private domain and failure-mode examples.

The `asset_url` values are placeholders. Replace them with either `file://` paths for local testing or HTTPS URLs for hosted assets.

## Local Test

```bash
export KDNA_REGISTRY_URL="file://$PWD/examples/private-registry/domains.json"
kdna registry refresh
kdna install @mycorp/writing_policy
kdna verify @mycorp/writing_policy --json
```

## Failure Modes

Before public use, run the repository trust tests:

```bash
node tests/registry-trust/run.mjs
```

The tests assert:

- yanked domains are rejected for new installs
- expired registry snapshots are rejected
- scoped entries without `trust_pubkey` are rejected
- digest mismatch fails with trust failure
- `application/x-kdna` is rejected

