# ADR-001: Canonical Access Vocabulary

- **Status**: accepted
- **Date**: 2026-06-25
- **Deciders**: KDNA Core team

## Context

The KDNA ecosystem currently has three competing access mode vocabularies:

| Vocabulary | Values |
|---|---|
| Legacy alias (widely used in code) | `open` / `protected` / `runtime` |
| SPEC.md canonical | `public` / `licensed` / `remote` |
| RFC-0009 introduced | `protected` as fourth protocol value |

In practice, 6 different code locations write 4 different values (`open`, `protected`, `licensed`, `public`). This fragmentation causes:
- `kdna protect` writes `protected` but `agent.js` checks for `licensed`
- `kdna-studio-swift` hardcodes `public` while `kdna-studio-core` writes `open`
- The design document `KDNA_ASSET_AUTHORIZATION_AND_DISTRIBUTION_STRATEGY_DRAFT.md` uses one vocabulary while the code uses another

## Decision

**Canonical output (the ONLY values Writers may emit):**

```
public | licensed | remote
```

**Legacy input compatibility (Readers accept with deprecation warning):**

| Legacy | Canonical |
|---|---|
| `open` | `public` |
| `protected` | `licensed` |
| `runtime` | `remote` |

**Rules:**

1. Readers in the migration period SHALL accept legacy alias values and emit a deprecation warning via `KDNA_AUTH_ACCESS_ALIAS` (info severity).
2. Writers, Studio, CLI, and examples MUST only write canonical values.
3. `protected` is NOT an access mode. Password protection is expressed as:
   ```json
   {
     "access": "licensed",
     "entitlement": { "profile": "password" }
   }
   ```
4. Legacy assets MAY be auto-migrated from `protected` to `licensed/password` ONLY when the crypto profile explicitly indicates password protection (`kdna.encryption.password`). Otherwise, the reader SHALL reject with `legacy manifest ambiguous`.

## Consequences

- All code locations writing `open`, `protected`, or `runtime` must be updated to their canonical equivalents.
- The `normalizeAccess()` function in `kdna-core/src/container/index.js` is the canonical implementation.
- All consumer code must check against canonical values, not raw manifest values.
- RFC-0009's introduction of `protected` as an access mode is superseded by this ADR.
