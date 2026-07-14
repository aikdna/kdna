# Runtime Contract v1 Conformance

These fixtures exercise the strict opt-in Capsule 2 execution boundary:

- ConsumptionPlan 1.0 plan-digest projection and JCS value;
- registered Host 2 and fail-closed `legacy_assumption` handling;
- the single formal `/2 + Capsule 2` Plan 1 pair, with no adapter or fallback;
- Host 2 request Plan/task/full-asset/projection/result/budget correlation and
  P recomputation;
- correlated `runtime_receipt` P echo and provider outcome invariants;
- all five JudgmentTrace 1.0 terminal states;
- exact character, elapsed, token, and model-call budget evidence;
- required-null versus missing and present-null versus non-null behavior;
- real Core source-directory rejection and seven audit-specific reproductions;
- rejection of generic digest fields, legacy downgrade, semantic-consumption
  claims, coordinated substitution, and cross-document tampering.

Run:

```bash
node conformance/runtime-contract-v1/run.mjs
```

`golden.json` reuses the committed Capsule 2 A/C/E/P vector. Its expected
Plan and result digests are committed constants; the verifier recomputes them
without rewriting the fixture. `negative-cases.json` contains deterministic
JSON Pointer mutations so each rejected value stays reviewable without
duplicating the full Capsule. `audit-negative-cases.json` freezes the seven
audit-specific attack or inconsistency reproductions.

Schema success alone is insufficient. The verifier also performs equality,
digest recomputation, request/receipt correlation, and negotiation checks that
JSON Schema cannot express.

The verifier operates on already-parsed JavaScript objects. It therefore
assumes a duplicate-key rejecting JSON parser has run first and does not claim
that `JSON.parse` can detect overwritten duplicate member names. Raw protocol
inputs MUST reject duplicate keys before object-level validation.
