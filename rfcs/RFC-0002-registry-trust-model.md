# RFC-0002: Registry Trust Model

Status: draft

## Summary

The Registry is the discovery and trust metadata layer for `.kdna` assets.

## Normative Rules

- Registry entries MUST use `asset_url` and `asset_digest`.
- `kdna_url` and bare `sha256` fields are invalid.
- Signed assets SHOULD include Ed25519 signatures tied to scope trust keys.
- Registry entries MUST expose `yanked`, `deprecated`, `risk_level`, and
  `review_status`.
- Yanked assets MUST NOT be installed by default.

## Future Work

The current model can evolve toward TUF-like root/targets/snapshot/timestamp
metadata when ecosystem scale requires stronger rollback and freeze protection.
