# RFC-0004: Runtime Loading Contract

Status: active

## Summary

Runtimes load `.kdna` assets directly or through hidden temporary caches. Caches
are not trust sources.

## Normative Rules

- Runtimes MUST verify `asset_digest` before trusting installed assets.
- Runtimes SHOULD verify signature when present or required by policy.
- Licensed entries MUST decrypt in memory.
- Traces MUST bind task output to asset name, version, and digest.
- Runtime output SHOULD preserve attribution when multiple domains are composed.
