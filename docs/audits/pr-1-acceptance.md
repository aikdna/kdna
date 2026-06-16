# PR-1 Acceptance Note — RFC-0013 Schema Baseline

**RFC-0013 phase:** PR-1
**Status:** All acceptance criteria met
**Re-run:** `npm run validate:rfc0013-schemas` (or `node scripts/validate-rfc0013-schemas.js`)

## Scope

This PR delivers the **schema baseline** for RFC-0013's three new authoring-time
object types. It does **not** implement the lint, gates, or smoke test (those are
PR-2, PR-3, PR-4 respectively).

### Schema files (3)

| File | RFC-0013 section | Purpose |
|------|------------------|---------|
| `schema/source_authority.schema.json` | §3.1 | Source Authority Graph — declares per-source type, authority, scope, conflict policies |
| `schema/truth_charter.schema.json`   | §3.2 | Truth Charter — locks the highest question, core insight, scope, anti-drift rules |
| `schema/module_manifest.schema.json` | §3.3 | Internal Module Manifest — declares internal_module / sub_domain / reference boundaries |

### Example files (3)

| File | Purpose |
|------|---------|
| `examples/source-authority/example.json` | Real `@aikdna/code_review` SAG with 4 sources and 2 conflict policies |
| `examples/truth-charter/example.json`    | Real `@aikdna/code_review` TC (status: locked) with renamed_terms |
| `examples/module-manifest/example.json`  | `@aikdna/code_review` modules (3 internal_module + 1 reference) |

These examples use `@aikdna/code_review` (a simple official legacy domain) as
the first test case, aligned with RFC-0013 §9 acceptance criteria #4 (amended
2026-06-16) and the RFC-0013 PR-1 through PR-4 strategy.

### Validation tooling (1)

| File | Purpose |
|------|---------|
| `scripts/validate-rfc0013-schemas.js` | ajv + ajv-formats based validation; also performs SAG cross-checks (precedence_order references, authority/status consistency) |

### npm entry point

Added `"validate:rfc0013-schemas": "node scripts/validate-rfc0013-schemas.js"`
to `package.json` scripts.

## Acceptance criteria

From the RFC-0013 PR-1 scope:

- [x] 3 schema files in `schema/` using JSON Schema Draft 2020-12
- [x] 3 example files in `examples/` that pass schema validation
- [x] Validation script that prints OK/FAIL per check
- [x] No changes to SPEC.md
- [x] No changes to runtime `.kdna` payload (`KDNA_Core.json`, `KDNA_Patterns.json`, etc.)
- [x] No new test framework (uses existing ajv + ajv-formats CommonJS stack)
- [x] No changes to existing 12 `@aikdna/*` domains

## Validation output

```
$ npm run validate:rfc0013-schemas

> @aikdna/kdna-monorepo@0.7.0 validate:rfc0013-schemas
> node scripts/validate-rfc0013-schemas.js

OK   Source Authority Graph: examples/source-authority/example.json
OK   Truth Charter: examples/truth-charter/example.json
OK   Module Manifest: examples/module-manifest/example.json

=== Cross-check: SAG precedence_order ===
OK   SAG precedence_order entries all reference valid source ids (4 entries)
OK   SAG authority/status internal consistency

RFC-0013 schema validation: all checks passed
```

## Cross-checks performed

1. **Schema validation** — each example passes its respective schema (3 checks)
2. **SAG precedence_order integrity** — every entry in `precedence_order` references an existing `source.id` (1 check)
3. **SAG authority/status consistency** — `current_highest` sources MUST have `can_override: true`; `deprecated` sources MUST have `status: "deprecated"` (1 check)

## Files NOT changed in this PR

Per the RFC-0013 PR-1 scope:

- ❌ No changes to `SPEC.md` (Anti-Monolithic Domain principle is in RFC-0013 §4 but is implemented in PR-2 as the lint)
- ❌ No changes to any existing `examples/communication/`, `examples/writing_basic/`, etc. kdna.json (those are v1 demo data; RFC-0013 §6 migration path will handle them in a later PR)
- ❌ No changes to `schema/kdna-manifest.json`, `KDNA_*.schema.json`, or any runtime schema
- ❌ No changes to registry/domains.json
- ❌ No changes to any other domain's source files

## Design notes

### enums vs freeform strings

Where RFC-0013 §3 explicitly enumerated values (e.g., `authority` levels,
`module_type` levels, `tc_status`), the schema enforces them as `enum`.
Where the RFC was deliberately open (e.g., `scope` field in SAG sources),
the schema allows a freeform string with a description, because domains
genuinely differ in what "scope" means.

### `if/then` for conditional requirements

`truth_charter.schema.json` and `module_manifest.schema.json` use
`if/then/allOf` to enforce conditional fields:
- TC: when `tc_status: "locked"`, `locked_at` and `locked_by` are required
- IMM: when `module_type: "sub_domain"`, `independent_asset: true` and `loadable_via` are required
- IMM: when `module_type: "internal_module"`, `maps_to` and `loadable_via` are required

This catches the most common authoring mistakes at schema-validation time
rather than at compile time.

### Anti-Monolithic hook (PR-2 preparation)

`module_manifest.schema.json` already includes the optional
`decomposition_rationale` field. PR-2's Anti-Monolithic lint will read
this as the maintainer sign-off for keeping a domain monolithic.

## Governance

- This PR is the first commit in the RFC-0013 implementation series.
- Per the standard governance rules, SPEC/RFC/schema changes
  normally go through a PR review. This commit is being prepared as
  a single PR-shaped commit to make review easier.
- The next commit on this branch should be the PR-1 PR description
  or, if merging directly, an audit note entry referencing this one.

## References

- RFC-0013 (design contract): `specs/RFC-0013-judgment-asset-lifecycle.md`
- RFC-0013 §9 acceptance criteria (amended): now requires simple official
  domain for first smoke test, atomspeak deferred to PR-5
- RFC-0013 implementation scope: PR-1 schema baseline
- RFC-0013 audit note: `docs/audits/2026-06-16-rfc-0013-audit-note.md`
- Existing schema validation pattern: `scripts/validate-app-schemas.js`
