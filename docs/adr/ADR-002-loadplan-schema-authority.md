# ADR-002: LoadPlan Schema Authority

- **Status**: accepted
- **Date**: 2026-06-25
- **Deciders**: KDNA Core team

## Context

Multiple spec documents disagree on the set of LoadPlan states:
- `kdna-authorization-contract.md` lists 9 states
- `kdna-loadplan.schema.json` lists 10 states (adds `expired_grace` and `denied`)
- Implementation code adds implicit states like `expired` (types.d.ts) and `revoked` (types.d.ts) that map to different names

TypeScript types (`types.d.ts`) are out of sync with both the schema and the implementation:
- `types.d.ts` lists `expired` but code uses `expired_grace`
- `types.d.ts` lists `revoked` but code uses `denied`
- `types.d.ts` lists unused `required_action` values (`none`, `migrate_legacy`)
- `types.d.ts` is missing used values (`contact_issuer`, `renew_entitlement`)

Additionally, there is a `required_action` naming conflict with RFC-0014 card-level `action` fields (validate, compose, render, source).

## Decision

1. **`schema/load-plan.schema.json` is the single authoritative source** for all LoadPlan states, required actions, and issue codes.

2. **The canonical state set** includes the fail-closed states `denied` and `expired_grace`. Internal sub-states may exist but MUST map to a public state.

3. **`required_action` values** are part of the schema. `migrate_legacy` and `renew_entitlement` are `required_action` values, not top-level states. New states SHALL NOT be added without schema approval.

4. **TypeScript types, Swift enums, documentation tables, and tests SHALL be generated from the schema**, not manually maintained.

5. **Responsibilities are strictly separated:**
   - `planLoad()` is a pure planning function: no password verification, no Keychain access, no remote calls.
   - `loadAuthorized()` executes the plan: obtains entitlement/secret, performs decryption.
   - Missing password → `needs_password` state, not a new error state.
   - Wrong password → stable `KDNA_DECRYPT_FAILED` issue code, NOT a new LoadPlan state.
   - A wrong password SHALL NOT produce a different LoadPlan state; it SHALL fail at decrypt time.

6. **The schema-level `action` in LoadPlan** is renamed to `required_action` to avoid confusion with RFC-0014 card-level `action` fields. This is already the field name in the schema.

## Consequences

- `types.d.ts` must be regenerated from the schema.
- All consumer code must route through `planLoad()` → `loadAuthorized()`.
- Manual counting of states is replaced by schema validation.
- Any spec document describing LoadPlan states must reference the schema, not inline lists.
