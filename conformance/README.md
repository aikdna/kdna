# KDNA Conformance Test Suite

This suite lets third-party implementations prove an asset-first KDNA contract.
It spans three version states, and each entry below says which one it covers:

| State | Consumer path | Where it is described |
| --- | --- | --- |
| Current source candidate | Core admission → Read | `docs/core-read-current-status.md` and the Core/Read package READMEs |
| Published `kdna-cli` 0.36.1 line | LoadPlan → Runtime Capsule | the published package and its own contract version |
| Historical contract (frozen) | the 0.1 Container/Capsule chain | `SPECINDEX` and the frozen specifications |

The Container, Runtime Capsule, Consumption Plan, Agent Host and Judgment Trace
path described below belongs to the published 0.36.1 line and the historical
contract; the current source candidate uses Core admission and Read instead.
Keep the two apart when you pick an entry point: the suites in this directory
below the "DSP095 public-contract candidate" section verify the published and
historical contracts, and the public-contract suite verifies the current one.
No legacy adapter or parallel runtime generation is part of either claim.

Conformance means:

- `.kdna` packaged bytes are the Runtime asset object;
- `kdna.json` uses `format_version: "0.1.0"`;
- `payload.kdnab` is strict CBOR with an explicit payload profile version;
- validation verifies format, schema, payload, checksums, and load contract;
- LoadPlan gates every Runtime projection;
- authorized loading emits `kdna.runtime-capsule` with
  `contract_version: "0.1.0"`;
- A, C, E, and P keep distinct digest bases;
- Plan, Host request, receipt, and Trace correlation fails closed;
- authoring directories cannot emit formal Runtime evidence.

Run the asset and loader suite:

```bash
npm run conformance
```

Run the correlated Runtime contract suite:

```bash
npm run conformance:runtime-contract
```

Check or rebuild derived Runtime fixtures:

```bash
npm run conformance:runtime-contract:check
npm run conformance:runtime-contract:update
```

The main runner supports these explicit scopes:

| Scope | Technical claim |
| --- | --- |
| `asset` | opens and inspects packaged assets |
| `loader` | validates, authorizes, loads, and renders projections |
| `asset-loader` | combined asset and loader behavior |
| `runtime` | follows the current packaged-asset Runtime boundary |
| `phase2-protocol` | validates the separate artifact, stage, fidelity, and product-runtime schema fixtures |

Passing is a technical compatibility signal. It is not a content-quality,
recommendation, trust, certification, or endorsement claim.

## Current evidence sets

These evidence sets verify the published 0.36.1 line and the frozen historical
contract, not the current source candidate.

| Directory | Evidence |
| --- | --- |
| `authorization/` | LoadPlan states and authorization failures |
| `envelope-aead/` | password KDF, AES key-wrap, ciphertext, tag, and AAD vectors |
| `external-grant/` | deterministic envelope, device wrap, grant signature, and negative vectors |
| `runtime-capsule/` | authoritative Capsule plus A/C/E/P evidence |
| `runtime-contract/` | Plan, capabilities, Host request/receipt, Trace, budgets, and negative cases |

Official generators own their committed outputs. A clean regeneration must be
byte-identical, and verifier runs consume rather than rewrite fixtures.

## Auxiliary artifact schemas

The `artifact-envelope/`, `stage-definition/`, `fidelity-result/`, and
`product-runtime/` fixtures validate separate JSON artifact protocols. They do
not replace the packaged-asset Runtime chain or authorize raw payload access.

## DSP095 public-contract candidate

The new suite is `node scripts/public-contract/run-vectors.mjs /absolute/isolated/runtime /absolute/report.json`. It compares actual operations to the unchanged 94 seed expectations and records the route for every case. `public-contract/test/runtime-obligations.cjs` separately exercises from-zero containers, typed asset-declaration retention, static closure, Host/budget/error paths and non-Schema obligations. Test-only fixture issuers are excluded from Core/Read packages; no vector expected values enter the implementation. Historical suites remain separate and are not used to establish the new candidate's behavior.
