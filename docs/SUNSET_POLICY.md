# Deprecation & Sunset Policy

> **Status:** 1.0-rc
> **Effective:** 2026-06-11

KDNA's deprecation policy ensures that users are never caught between a documented feature and its removal.

## Policy

1. **Deprecation notice** — A feature marked deprecated MUST document the replacement.

2. **Removal** — Deprecated items are removed when the replacement is available and documented. CHANGELOG must note the removal with migration instructions.

## Current Deprecated Items

| Item | Status | Replacement |
|------|--------|-------------|
| `kdna init <name>` | Deprecated | `kdna-studio create` (trusted) or `kdna dev scaffold` (dev-only) |
| `kdna_spec` field | Rejected | Use `format_version` in current manifests |
| singular `language` field | Rejected | Use `languages` array |
| Merged single-file JSON | Rejected | ZIP container format |
| Dev source directories (as runtime) | Non-canonical | Explicit packaged `.kdna` files |
| `~/.kdna/domains/` | Legacy | Explicit file or exact user-approved Host attachment |
| All protocol-level asset quality / risk / trust / recommendation / production badges | Retired | Issuer-scoped external assessments plus caller-owned adoption policy |

## Un-deprecated Items

| Item | Previous Status | Current Status | Reason |
|------|----------------|----------------|--------|
| `kdna dev pack` | Marked "Deprecated" in error | Pre-release | Actively maintained. Serves a real need for dev-to-asset conversion. |

## Enforcement

The `kdna dev validate` command warns about rejected fields and retired badge names.

The current Preview uses `kdna validate` for container and Schema rejection,
then `kdna plan-load` for authorization and compatibility diagnostics. The old
asset-signature `verify` surface is not part of the Preview candidate.

## For Contributors

When adding a deprecation:
1. Add an entry to this document
2. Add a warning to the deprecated feature's help text
3. Document the migration path in the deprecation message
