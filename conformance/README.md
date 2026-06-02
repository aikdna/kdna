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
- Validation rejects assets without root `mimetype`, manifests with `kdna_spec`,
  and manifests with singular `language`.
- Rendering produces deterministic agent context for a known fixture.
- Inspection exposes asset metadata, entries, digests, quality, and risk.

Run:

```bash
npm run conformance
```

Certification-oriented run:

```bash
npm run certify:asset-loader
# or
node conformance/run.mjs --profile asset
node conformance/run.mjs --profile loader
node conformance/run.mjs --profile runtime
node conformance/run.mjs --profile registry
```

Profiles are intentionally explicit:

| Profile | Claim |
| --- | --- |
| `asset` | Implementation can open and inspect canonical `.kdna` assets. |
| `loader` | Implementation can validate, load, render, and digest-check assets. |
| `asset-loader` | Combined asset + loader compatibility for SDKs and adapters. |
| `runtime` | Runtime follows asset-first loading behavior. |
| `registry` | Registry implementation preserves required metadata and trust checks. |

Passing this suite is a technical compatibility signal. Public use of
`Certified KDNA` marks still requires registry governance approval; see
[`TRADEMARK.md`](../TRADEMARK.md) and
[`docs/kdna-compatible-certification.md`](../docs/kdna-compatible-certification.md).

The runner generates temporary `.kdna` fixtures under
`conformance/fixtures/generated/` from in-file definitions. Generated assets are
not source of truth; the test definitions and expected outputs are.

## Fixture Matrix

| Fixture | Expected |
| --- | --- |
| `valid/minimal-domain.kdna` | loads, validates, renders |
| `valid/full-domain.kdna` | loads optional entries and index profile |
| `valid/licensed-domain.kdna` | decrypts and loads with correct hook (RFC-0008) |
| `invalid/missing-core.kdna` | fails required-entry validation |
| `invalid/missing-patterns.kdna` | fails required-entry validation |
| `invalid/duplicate-id.kdna` | fails lint validation |
| `invalid/bad-meta.kdna` | fails cross-file validation |
| `invalid/missing-mimetype.kdna` | fails media marker validation |
| `invalid/disallowed-kdna-spec.kdna` | fails manifest validation |
| `invalid/disallowed-language.kdna` | fails manifest validation |
| `invalid/non-yes-no-self-check.kdna` | warns on weak self-check |
| `valid/licensed-domain.kdna` (no hook) | fails when encrypted entries present but no decrypt hook |
| `valid/licensed-domain.kdna` (wrong key) | fails decryption with wrong license key |
| `invalid/licensed-tampered-ciphertext.kdna` | fails integrity check on tampered ciphertext |
| `invalid/app-private-envelope.kdnasealed` | rejected — only `.kdna` is canonical |

External implementations should produce equivalent pass/fail behavior and
compatible inspect/load output for the same fixtures.

The last run writes a machine-readable summary to
`$TMPDIR/kdna-conformance-last-run.json`.
