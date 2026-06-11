# Deprecation & Sunset Policy

> **Status:** v1.0-rc  
> **Effective:** 2026-06-11

KDNA's deprecation policy ensures that users are never caught between a documented feature and its removal.

## Policy

1. **Deprecation notice** — A feature marked deprecated MUST have a documented sunset date. Without a date, the deprecation is advisory only and the feature remains supported.

2. **Grace period** — Deprecated features remain available for at least one minor version after the deprecation notice. Breaking removal without a grace period is a spec violation.

3. **Removal** — On or after the sunset date, the feature MAY be removed. Removal MUST be noted in the CHANGELOG with migration instructions.

## Current Deprecated Items

| Item | Status | Deprecated | Sunset | Replacement |
|------|--------|-----------|--------|-------------|
| `kdna init <name>` | Deprecated | 2026-05-25 | 2026-07-01 | `kdna-studio create` (trusted) or `kdna dev scaffold` (dev-only) |
| `kdna dev pack` | **Beta** (not deprecated) | — | — | `kdna-studio compile/export` for trusted assets |
| `kdna_spec` field | Rejected | 2026-05-20 | Enforced now | Use `spec_version` |
| singular `language` field | Rejected | 2026-05-20 | Enforced now | Use `languages` array |
| Merged single-file JSON | Rejected | 2026-05-20 | Enforced now | ZIP container format |
| Dev source directories (as runtime) | Non-canonical | 2026-05-27 | Enforced now | `.kdna` assets in `~/.kdna/packages/` |
| `~/.kdna/domains/` | Legacy | 2026-05-27 | 2026-08-01 | `~/.kdna/packages/` |
| `basic` / `pro` / `reference` badges | Retired | 2026-05-20 | Enforced now | `untested` / `tested` / `validated` / `expert_reviewed` / `production_ready` |

## Un-deprecated Items

| Item | Previous Status | Current Status | Reason |
|------|----------------|----------------|--------|
| `kdna dev pack` | Marked "Deprecated" in error | Beta | Actively maintained (last update v0.19.2, 2026-05-29). Serves a real need for dev-to-asset conversion without Studio. The README "Deprecated" label was a copy-paste error — never reflected in code or CHANGELOG. |

## Enforcement

The `kdna dev validate` command warns about:
- Rejected fields (`kdna_spec`, singular `language`)
- Retired badge names (`basic`, `pro`, `reference`)

The `kdna verify` command rejects `.kdna` assets with:
- Rejected fields
- Rejected format (merged single-file JSON)
- Stale spec versions (pre-v1.0-rc without explicit migration flag)

## For Contributors

When adding a deprecation:
1. Add an entry to this document with a sunset date at least one minor version away
2. Add a warning to the deprecated feature's help text
3. Document the migration path in the deprecation message
