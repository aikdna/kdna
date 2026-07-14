# KDNA Conformance Test Suite

This suite lets third-party loaders, validators, and adapters prove that they
implement the asset-first KDNA contract. Some legacy profiles remain for
historical compatibility testing; they are not part of the current conformance
path.

Capsule 2 A/C/E/P goldens live in `capsule-v2/`. Run them with
`npm run conformance:capsule-v2`; they freeze the opt-in Core primitives and do
not change the default Capsule 1 Runtime route.

The strict opt-in Plan 1.0 / Host 2 / JudgmentTrace 1.0 boundary lives in
`runtime-contract-v1/`. Run it with
`npm run conformance:runtime-contract-v1`. It checks schemas plus plan/P
recomputation, negotiation, receipt correlation, source-directory rejection,
and negative vectors. It does not flip the Plan 0.9 / Capsule 1 / Host 1
defaults.

Conformance means:

- `.kdna` is the canonical asset object.
- The loader reads `kdna.json`, verifies `payload.kdnab`, checks digests, and
  emits only authorized runtime projections after LoadPlan allows loading.
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
| `registry` | Legacy registry implementation profile; not part of the current conformance path. |
| `phase2-protocol` | Implementation validates all Phase 2 RFC schema fixtures (artifact-envelope, fidelity-result, product-runtime, stage-definition). |

Passing this suite is a technical compatibility signal. It is not a content
quality, recommendation, certification, or endorsement claim.

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

## Phase 2 Protocol Fixtures

In addition to the `.kdna` asset conformance suite above, Phase 2 introduces
static JSON fixtures for each RFC schema. These validate protocol artifact
shapes independently of the asset loader.

| Directory | Schema | Valid | Invalid |
|-----------|--------|-------|---------|
| `artifact-envelope/` | `artifact-envelope.schema.json` (RFC-0009) | valid-minimal, valid-full | missing-required, bad-enum, bad-linkage |
| `fidelity-result/` | `fidelity-result.schema.json` (RFC-0010) | valid-minimal, valid-full | missing-required, bad-enum |
| `product-runtime/` | `product-runtime.schema.json` (RFC-0011) | valid-minimal, valid-full | missing-required, bad-enum |
| `stage-definition/` | `stage-definition.schema.json` (RFC-0009) | valid-minimal, valid-full | missing-required |

Validate all Phase 2 fixtures with:

```bash
kdna protocol validate conformance/artifact-envelope/valid-minimal.json --schema artifact-envelope
kdna protocol validate conformance/fidelity-result/valid-minimal.json --schema fidelity-result
kdna protocol validate conformance/product-runtime/valid-minimal.json --schema product-runtime
kdna protocol validate conformance/stage-definition/valid-minimal.json --schema stage-definition
```

Invalid fixtures should be rejected by their respective schemas. A
third-party claiming KDNA Phase 2 compatibility must pass validation on all
valid fixtures and correctly reject all invalid ones.
