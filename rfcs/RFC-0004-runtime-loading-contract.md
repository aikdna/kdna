# RFC-0004: Runtime Loading Contract

Status: active technical boundary; storage layout is implementation-defined

## Summary

Runtimes load `.kdna` assets directly or through hidden temporary caches. Caches
are not trust sources.

## Normative Rules

- Runtimes MUST verify `asset_digest` before trusting an explicit file or
  user-approved attachment.
- Runtimes SHOULD verify signature when present or required by policy.
- Licensed entries MUST decrypt in memory.
- Traces MUST bind task output to asset name, version, and digest.
- Runtime output SHOULD preserve attribution when multiple domains are composed.

Finding a file, storing a copy, attaching it to a Host scope, authorizing it,
deciding applicability, and loading it are separate. A runtime cache or legacy
package store is not an independent source of authority.
