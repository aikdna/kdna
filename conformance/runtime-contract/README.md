# Runtime Contract Conformance

These fixtures exercise the sole current Runtime execution boundary:

- Consumption Plan integrity and independent accepted-digest correlation;
- Runtime Capsule and Agent Host compatibility negotiation;
- task, asset, projection, result, budget, and P correlation;
- correlated Host receipts, P recomputation, and provider outcome invariants;
- all Judgment Trace terminal states;
- exact character budgets and receipt-backed elapsed, token, and model-call
  evidence;
- required-null, missing, and present-null distinctions;
- source-directory rejection and deterministic negative reproductions.

All KDNA-owned compatibility coordinates in this suite are `0.1.0`. There is
no fallback or adapter to a parallel Capsule, Plan, or Host generation.

Run the verifier:

```bash
node conformance/runtime-contract/run.mjs
```

Check reproducibility without writing, or explicitly rebuild derived files:

```bash
npm run conformance:runtime-contract:check
npm run conformance:runtime-contract:update
```

The generator loads the authoritative packaged asset bytes, records A/C/E,
builds the Plan and Host request through the public Core API, constructs
independently validated receipts, and builds every terminal Trace through the
public trace API. The verifier reloads those bytes and recomputes Plan,
delivery, and result digests without rewriting fixtures.

Schema success alone is insufficient. Equality, digest recomputation,
request/receipt correlation, negotiation, and budget checks are enforced by
Core. All committed JSON enters through `parseRuntimeContractJson()` so
duplicate members and invalid raw JSON cannot be normalized away by
`JSON.parse()` before validation.
