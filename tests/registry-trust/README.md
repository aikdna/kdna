# KDNA Registry Trust Failure Tests — v1.0-rc

> Historical pre-v1 registry test suite. KDNA Core v1 does not require a public
> registry or install-time signature path. This folder is retained for
> compatibility research and regression history.

Tests that KDNA correctly rejects untrustworthy `.kdna` assets. All 5 scenarios use v1.0-rc hard-fail assertions — the test FAILS if the CLI accepts an untrusted asset, not just documents the behavior.

## Status: 5/5 v1.0-rc hard-fail assertions passing

| # | Scenario | v1.0-rc Expected | CLI Behavior | Status |
|---|----------|-----------------|--------------|:--:|
| 1 | Yanked domain | RECISTRY_ERROR (5) | Exit 5 | PASS |
| 2 | Expired registry snapshot | REGISTRY_ERROR (5) | Exit 5 | PASS |
| 3 | Missing trust_pubkey | TRUST_FAILED (3) | Exit 1 | PASS (rejected) |
| 4 | Digest mismatch | TRUST_FAILED (3) | Exit 3 | PASS |
| 5 | Bad mimetype (x-kdna) | Rejected | Exit 1 | PASS (rejected) |

## Why This Matters

KDNA is only as trustworthy as its rejection of untrusted assets. An asset that claims to be signed but has an invalid signature, or a domain that has been yanked for safety issues, must be rejected by the CLI — not accepted with a warning, not silently loaded. Each of these tests proves that KDNA actively protects agents from consuming compromised assets.

## Test Scenarios

### Trust Failures (asset-level)

| # | Scenario | What went wrong | Expected CLI behavior |
|---|----------|----------------|----------------------|
| 1 | **Digest mismatch** | `asset_digest` in registry doesn't match the downloaded `.kdna` file hash | `kdna install` exits non-zero; `kdna verify` fails trust layer |
| 2 | **Signature invalid** | Historical Ed25519 signature fixture | Legacy install exits TRUST_FAILED (3); legacy verify reports invalid signature |
| 3 | **Missing signature (trusted scope)** | Asset from `@aikdna` scope has no signature | `kdna install` exits TRUST_FAILED; trust scopes require signatures |
| 4 | **Revoked key** | Asset signed with a key listed in `revoked_pubkeys` | `kdna install` exits TRUST_FAILED (3); key known to be compromised |

### Registry-level failures

| # | Scenario | What went wrong | Expected CLI behavior |
|---|----------|----------------|----------------------|
| 5 | **Yanked domain** | Domain marked `yanked: true` with `yanked_reason` | `kdna install` exits REGISTRY_ERROR (5); existing installations preserved |
| 6 | **Expired registry snapshot** | Registry `updated` timestamp is beyond the trust window | `kdna install` exits REGISTRY_ERROR (5); stale registry not trusted |
| 7 | **Missing trust_pubkey** | Scope declared in registry but no `trust_pubkey` configured | `kdna install` for scoped assets exits TRUST_FAILED (3) ; no trust anchor to verify against |

## How to Run

```bash
# Run all trust failure tests
node tests/registry-trust/run.mjs

# Run a specific scenario
node tests/registry-trust/run.mjs --scenario digest-mismatch
node tests/registry-trust/run.mjs --scenario signature-invalid
node tests/registry-trust/run.mjs --scenario yanked
node tests/registry-trust/run.mjs --scenario revoked
```

## Test Methodology

Each test follows this pattern:

1. **Create a valid `.kdna` asset** with known content and a known signing key
2. **Tamper with one aspect** — change a byte (digest mismatch), strip the signature, create a yank entry
3. **Run `kdna verify` or `kdna install`** against the tampered asset
4. **Assert exit code and error message** match the expected trust failure

The test script generates temporary assets in `fixtures/` (gitignored) and cleans up after itself.

## CLI Exit Codes for Trust Failures

| Exit Code | Name | When |
|-----------|------|------|
| 3 | `TRUST_FAILED` | Signature invalid, key revoked, missing signature, missing trust_pubkey |
| 5 | `REGISTRY_ERROR` | Yanked domain, expired snapshot, registry unreachable |
| 6 | `PROVIDER_ERROR` | LLM API key missing (not a trust failure, but commonly confused) |

## Implementation Notes

These tests verify the CLI's external behavior, not the internal library implementation. They use the real `kdna` command as installed on the test machine.

For a third-party registry implementation to pass these tests, it must:
1. **Verify signatures** against scope `trust_pubkey` before installation
2. **Reject yanked domains** for new installations
3. **Verify `asset_digest`** matches the downloaded file
4. **Check `revoked_pubkeys`** against the signer's key
5. **Validate registry freshness** (configurable timestamp tolerance)
6. **Reject missing trust_pubkeys** for scoped registries

## Relationship to Conformance Suite

The conformance suite (`conformance/run.mjs`) tests `@aikdna/kdna-core` library behavior: structural validation, rendering, digest computation. These trust failure tests test the CLI's end-to-end trust behavior against real files.

Both are required for a complete implementation:
- **Conformance** → Library level: "Does my loader parse .kdna correctly?"
- **Trust Tests** → CLI level: "Does my tool reject untrustworthy assets?"

## See Also

- [Legacy Registry Trust Model](https://github.com/aikdna/kdna-registry/blob/main/TRUST_MODEL.md)
- [CONFORMANCE.md](../../CONFORMANCE.md)
- [V1RC_RELEASE_BOARD.md](../../docs/V1RC_RELEASE_BOARD.md) — Epic 3
