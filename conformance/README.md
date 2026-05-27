# KDNA Conformance Test Suite

This suite lets third-party loaders, validators, adapters, and registries prove
that they implement the asset-first KDNA contract.

Conformance means:

- `.kdna` is the canonical asset object.
- The loader reads `kdna.json`, `KDNA_Core.json`, and `KDNA_Patterns.json`
  directly from the asset container.
- Validation rejects missing required entries, malformed manifest metadata,
  duplicate IDs, invalid self-checks, unresolved references, and digest
  mismatches.
- Rendering produces deterministic agent context for a known fixture.
- Inspection exposes asset metadata, entries, digests, quality, and risk.

Run:

```bash
npm run conformance
```

The runner generates temporary `.kdna` fixtures under
`conformance/fixtures/generated/` from in-file definitions. Generated assets are
not source of truth; the test definitions and expected outputs are.

## Fixture Matrix

| Fixture | Expected |
| --- | --- |
| `valid/minimal-domain.kdna` | loads, validates, renders |
| `valid/full-domain.kdna` | loads optional entries and index profile |
| `invalid/missing-core.kdna` | fails required-entry validation |
| `invalid/missing-patterns.kdna` | fails required-entry validation |
| `invalid/duplicate-id.kdna` | fails lint validation |
| `invalid/bad-meta.kdna` | fails cross-file validation |
| `invalid/non-yes-no-self-check.kdna` | warns on weak self-check |

External implementations should produce equivalent pass/fail behavior and
compatible inspect/load output for the same fixtures.
