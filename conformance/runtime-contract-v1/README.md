# Runtime Contract v1 Conformance

These fixtures exercise the strict opt-in Capsule 2 execution boundary:

- ConsumptionPlan 1.0 plan-digest projection and JCS value;
- registered Host 2 and explicit descriptorless `legacy_assumption`;
- the restricted `/2 + Capsule 2` and `/1 + Capsule 1` pair matrix;
- Host 2 request Capsule schema, asset correlation, and P recomputation;
- correlated `runtime_receipt` P echo and provider outcome invariants;
- JudgmentTrace 1.0 success and source-directory blocked paths;
- required-null versus missing and present-null versus non-null behavior;
- rejection of generic digest fields, silent downgrade, semantic-consumption
  claims, and cross-document tampering.

Run:

```bash
node conformance/runtime-contract-v1/run.mjs
```

`golden.json` reuses the committed Capsule 2 A/C/E/P vector. Its expected
Plan and result digests are committed constants; the verifier recomputes them
without rewriting the fixture. `negative-cases.json` contains deterministic
JSON Pointer mutations so each rejected value stays reviewable without
duplicating the full Capsule.

Schema success alone is insufficient. The verifier also performs equality,
digest recomputation, request/receipt correlation, and negotiation checks that
JSON Schema cannot express.
