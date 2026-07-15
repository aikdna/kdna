# Runtime Execution Contract

**Status:** current normative single-asset execution contract

**Compatibility coordinate:** `0.1.0`

Normative schemas:

- [Runtime Capsule](./runtime-capsule.schema.json)
- [Digest evidence](./digest-evidence.schema.json)
- [Consumption Plan](./consumption-plan.schema.json)
- [Agent Host capabilities](./agent-host-capabilities.schema.json)
- [Agent Host request](./agent-host-request.schema.json)
- [Agent Host receipt](./agent-host-receipt.schema.json)
- [Judgment Trace](./judgment-trace.schema.json)

The contract covers one packaged asset and one `single_judgment` Host call.
Cluster selection and staged execution are separate coordination work.

## 1. Responsibility chain

```text
packaged .kdna bytes
→ validation and authorization
→ Runtime Capsule
→ Consumption Plan
→ capability negotiation
→ Agent Host request
→ correlated receipt
→ Judgment Trace
```

The chain has one current set of KDNA-owned compatibility coordinates:

- Capsule `contract_version: "0.1.0"`;
- Plan `contract_version: "0.1.0"`;
- Host `protocol: "kdna.agent-host"` and `protocol_version: "0.1.0"`;
- Trace `contract_version: "0.1.0"`.

There is no adapter or fallback to a parallel Capsule, Plan, or Host
generation. Unsupported coordinates fail closed before provider execution.

## 2. Invariants

1. A, C, E, and P use the exact names and bases defined by the Capsule and
   digest-evidence schemas. Generic digest aliases have no authority.
2. P is detached from the Capsule it hashes and is independently recomputed at
   the Host boundary.
3. Source directories are authoring inputs and cannot produce formal Runtime
   execution evidence.
4. Plan integrity, capability selection, identity correlation, budgets, and P
   are checked before provider execution.
5. A receipt proves a correlated technical boundary event. It does not prove
   semantic consumption, influence, judgment quality, or conformance.
6. Protocol objects are closed. Opaque task `context` is the intentionally open
   value boundary.

## 3. Consumption Plan integrity

The Plan identifies itself with `type: "kdna.consumption-plan"` and
`contract_version: "0.1.0"`. Its integrity profile is
`kdna.canonicalization.consumption-plan-jcs`.

The Plan digest is SHA-256 of the RFC 8785 JCS serialization of the exact Plan
after removing only the root `integrity` member. Array order, nullable values,
task context, budget, constraints, trace policy, accepted compatibility
coordinates, and creation time are all covered.

A verifier must:

1. parse raw JSON without normalizing duplicate keys or invalid Unicode;
2. validate the Plan schema and integrity profile;
3. recompute the digest;
4. compare it with both `integrity.plan_digest` and the independently accepted
   digest supplied by the caller.

The Plan's `asset_ref.expected_digests` keeps A, C, and E distinct. A value
computed locally during planning is not independent registry or receipt
evidence; its source must say `caller`.

## 4. Capability observation and negotiation

Host capabilities are observed before projection delivery. The descriptor
must conform to `agent-host-capabilities.schema.json` and include:

- `type: "kdna.agent-host-capabilities"`;
- `protocol_version: "0.1.0"`;
- an explicit capability basis;
- supported Host protocols;
- supported Capsule compatibility coordinates;
- supported Capsule digest profiles and their versions.

Core selects the pair only when the validated Plan, Core, and observed Host
intersect on Capsule `0.1.0`, protocol `kdna.agent-host`, and the required P
profile. Missing Capsule support, protocol support, or verifiable pairing
blocks with a specific issue code.

## 5. Agent Host boundary

Before invoking a provider, the Host boundary must:

1. parse one request through a duplicate-key-rejecting JSON boundary;
2. validate the request and embedded Capsule schemas;
3. correlate Plan ID and independently accepted Plan digest;
4. require exact task, authority, asset, projection, result, budget, and
   constraint equality with the validated Plan;
5. require exact asset ID, UID, version, judgment version, and access equality;
6. verify named A/C/E expectations without substituting one basis for another;
7. require Capsule `contract_version: "0.1.0"`;
8. recompute P over the exact embedded Capsule;
9. compare P with the request before provider execution.

The correlated receipt echoes the request ID and records the sender P, Host
recomputed P, Host echo, comparison state, provider execution status, outcome,
usage, model-identity basis, and semantic-consumption state.

A P mismatch must return a correlated pre-execution rejection and must not
invoke the provider. Completed execution requires a non-null structured result;
failed, cancelled, timed-out, and not-started outcomes are null.

Semantic consumption remains `not_observed`. P equality and Host completion
cannot upgrade it. A model identity is either explicitly Host-reported or null
with basis `not_observed`.

## 6. Budget evidence

Projection and task character limits are enforced before Host delivery.
Character counts use Unicode scalar values over the exact canonical values.
Elapsed time, token use, and model-call counts are copied from the correlated
receipt when observed; they are never estimated.

For every limited dimension, comparison is derived from the exact limit and
actual value. An absent observation cannot claim `within_limit`. If projection
or task exceeds an enforceable pre-Host limit, no Host request is deliverable;
the terminal blocked Trace retains sender-side A/C/E/P and exact budget facts.

## 7. Judgment Trace

`kdna.judgment-trace` records the terminal execution facts for completed,
blocked, failed, cancelled, or timed-out paths. It correlates:

- the accepted Plan digest;
- negotiation inputs and selected pair;
- asset identity and named A/C/E evidence;
- P delivery evidence and request ID;
- the exact Host receipt when present;
- execution, model identity, semantic-consumption, budget, result, errors, and
  warnings.

The result digest uses `kdna.canonicalization.result-jcs` over the exact
non-null Host outcome. It is not A, C, E, or P.

## 8. Raw JSON boundary

`parseRuntimeContractJson()` is the reference raw boundary. It rejects
duplicate keys, invalid UTF-8, a byte-order mark, invalid scalar values,
non-finite numbers, trailing input, and excessive size or depth before object
validation. Plain `JSON.parse()` alone is not a compatible boundary because it
can erase evidence such as duplicate member names.
