# Runtime Contract v1 Conformance

These fixtures exercise the strict opt-in Capsule 2 execution boundary:

- ConsumptionPlan 1.0 plan-digest projection and JCS value;
- registered Host 2 and fail-closed `legacy_assumption` handling;
- the single formal `/2 + Capsule 2` Plan 1 pair, with no adapter or fallback;
- Host 2 request Plan/task/full-asset/projection/result/budget correlation and
  P recomputation;
- correlated `runtime_receipt` P echo, fail-closed P mismatch, and provider
  outcome invariants;
- all five JudgmentTrace 1.0 terminal states;
- exact character budgets plus receipt-backed elapsed, token, and model-call
  evidence; non-null limits with unobserved actuals cannot claim
  `within_limit`;
- required-null versus missing and present-null versus non-null behavior;
- real Core source-directory rejection and twelve audit-specific reproductions;
- rejection of generic digest fields, legacy downgrade, semantic-consumption
  claims, coordinated substitution, and cross-document tampering.

Run:

```bash
node conformance/runtime-contract-v1/run.mjs
```

The committed Plan, request, receipts, and traces are derived from the
authoritative Capsule conformance bytes. Check reproducibility without writing,
or explicitly rebuild the derived files:

```bash
npm run conformance:runtime-contract:check
npm run conformance:runtime-contract:update
```

The generator loads the official packaged bytes, records A/C/E with explicit
matched or not-compared evidence, builds the Plan and request through the public
Core API, constructs independently validated Host receipts, and builds every
committed terminal trace through the public trace API. The verifier independently
reloads the official bytes and rejects lineage drift; it recomputes Plan,
delivery, and result digests without rewriting fixtures. `negative-cases.json`
contains deterministic JSON Pointer mutations so each rejected value stays reviewable without
duplicating the full Capsule. `audit-negative-cases.json` freezes the twelve
audit-specific attack or inconsistency reproductions.

Schema success alone is insufficient. The conformance runner is now a pure
consumer of the `@aikdna/kdna-core` public execution-contract API. The package
performs equality, digest recomputation, request/receipt correlation, and
negotiation checks that JSON Schema cannot express; the runner contains no
second semantic implementation.

All committed fixture files enter through
`parseExecutionContractJsonV1()`, the duplicate-key rejecting raw JSON
boundary. Host adapters MUST use that boundary (or an equivalent strict
parser) before object-level validation. Plain `JSON.parse()` overwrites
duplicate member names and is not a compatible Host 2 input boundary.
