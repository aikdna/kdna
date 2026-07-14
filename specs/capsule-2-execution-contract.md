# Capsule 2 Execution Contract

**Status:** opt-in protocol contract
**Contract versions:** ConsumptionPlan 1.0, Agent Host capability descriptor
1.0, Agent Host 2, JudgmentTrace 1.0
**Default compatibility path:** ConsumptionPlan 0.9, Runtime Capsule 1, Agent
Host 1

This document defines the first independently verifiable execution boundary
for Runtime Capsule 2. It does not change the default Core or CLI path, does
not make Capsule 2 a release default, and does not redefine Grant v1,
Envelope v1, or AAD v1.

Normative schemas:

- [ConsumptionPlan 1.0](./consumption-plan-1.schema.json)
- [Agent Host capability descriptor 1.0](./agent-host-capabilities-1.schema.json)
- [Agent Host 2 request](./agent-host-2-request.schema.json)
- [Agent Host 2 correlated response receipt](./agent-host-2-receipt.schema.json)
- [JudgmentTrace 1.0](./judgment-trace-1.schema.json)
- [Runtime Capsule 2](./runtime-capsule-2.schema.json)
- [Digest evidence](./digest-evidence.schema.json)

JudgmentTrace 1.0 is the authority defined by
`judgment-trace-1.schema.json`. It is not the CLI's historical
`trace-v1.schema.json` Consumption Trace and is not a relabeling of the
JudgmentTrace 0.9 candidate. Historical traces remain immutable evidence.

## 1. Scope and invariants

The contract covers one packaged asset and one `single_judgment` Host call.
Cluster selection and staged execution are not part of Plan 1.0.

The following invariants are mandatory:

1. A, C, E, and P use the exact names and bases defined in
   [Runtime Capsule](./runtime-capsule.md). A generic `digest`,
   `content_digest`, or `digest_verified` field has no authority here.
2. P is detached from the Capsule it hashes. It appears in the Host request,
   correlated runtime receipt, and JudgmentTrace only.
3. Source directories are authoring inputs. They cannot satisfy Plan 1.0's
   `require_packaged_asset: true` and cannot emit a formal Runtime Capsule.
4. Protocol selection happens before provider or model execution. An empty
   intersection, an unsupported protocol/Capsule pair, schema failure,
   identity mismatch, or P mismatch fails closed.
5. A Host receipt proves acceptance at a correlated boundary. It does not
   prove semantic reading, influence, judgment quality, or conformance.
6. Every schema-defined object is closed with `additionalProperties: false`.
   Opaque task `context` is the only intentionally open value boundary.

## 2. ConsumptionPlan 1.0 integrity

Plan 1.0 is an explicit opt-in contract. Existing planners continue to emit
Plan 0.9 unless their caller selects Plan 1.0.

### 2.1 Digest profile

Profile ID: `kdna-consumption-plan-jcs-v1`

The Plan carries its integrity record at the root `integrity` member. The
digest input is an audited projection that excludes that member to avoid
self-reference:

```text
projection = exact Plan object after removing the root member "integrity"
canonical  = RFC-8785-JCS(projection)
plan_digest = "sha256:" + lowercase_hex(SHA-256(UTF-8(canonical)))
```

Rules:

- remove exactly the root `integrity` member and no other member;
- do not remove nested members named `integrity`;
- hash every remaining Plan value, including `created_at`, array order,
  nullable fields, task context, budgets, and accepted-version order;
- emit no byte-order mark and no trailing newline;
- reject duplicate keys, invalid Unicode, non-finite numbers, non-JSON
  values, and values that RFC 8785 cannot represent;
- compare the recomputed value with `integrity.plan_digest` before using the
  Plan;
- do not compute an expected value with ordinary `JSON.stringify`.

The profile is deliberately part of the excluded `integrity` record. A
verifier first checks that `integrity.profile` equals the single schema
constant, then applies the algorithm above. A future profile requires a new
schema or explicit profile support; it must not be guessed.

### 2.2 Expected digests

`asset_ref.expected_digests` always contains the named `asset`, `content`, and
`runtime_entry_set` members. Each member is either a complete expected-value
record with its fixed basis and source, or `null` when the Plan carries no
expectation for that digest.

An A value computed from the same input in the same planning operation is not
an independent registry or receipt match. Its source is `caller`; Core must
still record the eventual comparison honestly.

### 2.3 Capsule profile versus result shape

`projection_request.profile` selects the Runtime Capsule projection.
`result_request.shape` describes the requested Host result and may be `null`.
The two vocabularies are separate and MUST NOT be substituted for one another.

## 3. Presence and null semantics

The contracts distinguish three cases:

| Schema shape | Meaning |
| --- | --- |
| required and non-null | the fact must exist and be known |
| required and nullable | the fact must be recorded; `null` honestly says unavailable or not requested |
| optional and non-null | the member may be absent, but a present `null` is invalid |

Implementations MUST preserve this distinction. A decoder such as Swift
`decodeIfPresent`, which treats an explicit `null` like an absent member,
cannot by itself enforce an optional-non-null field. Implementations must
check raw key presence or use a decoding path that rejects present `null`.
Conformance fixtures cover both missing required members and present-null
values.

## 4. Capability observation and negotiation

Host capabilities must be available before Core projection or Host
invocation. A registered descriptor validates against
`agent-host-capabilities-1.schema.json` and uses
`capability_basis: registered_descriptor`.

A Host with no descriptor is not probed after execution starts and is not
assumed to support current features. The Runner synthesizes exactly:

```json
{
  "type": "kdna.agent-host.capabilities",
  "version": "1.0",
  "capability_basis": "legacy_assumption",
  "host_protocols": ["kdna.agent-host/1"],
  "capsule_versions": ["1.0"],
  "capsule_digest_profiles": []
}
```

### 4.1 Orthogonal model, restricted first matrix

Protocol and Capsule versions are separate capability dimensions. The first
execution contract intentionally supports only two pairs:

| Host protocol | Delivered Capsule | State |
| --- | --- | --- |
| `kdna.agent-host/2` | `2.0` | supported; Host validates Capsule 2 and P |
| `kdna.agent-host/1` | `1.0` | supported legacy path |
| `kdna.agent-host/2` | `1.0` | blocked in this contract revision |
| `kdna.agent-host/1` | `2.0` | blocked in this contract revision |

The separation is retained so a future contract can add a pair without
renaming either dimension. Implementations MUST NOT treat the cartesian
product as supported today.

### 4.2 Selection algorithm

1. Validate the Plan and recompute its plan digest.
2. Obtain Core-supported Capsule versions and a Host capability descriptor.
3. Intersect Plan, Core, and Host Capsule versions by exact string.
4. Intersect Plan and Host protocols by exact string.
5. Evaluate supported pairs in Plan Capsule preference order. For a Capsule
   version, choose the highest compatible protocol: Host 2 before Host 1.
6. Select only a pair permitted by the matrix above.
7. If there is no Capsule intersection, block with
   `KDNA_CAPSULE_VERSION_UNSUPPORTED`.
8. If there is no protocol intersection, block with
   `KDNA_HOST_PROTOCOL_UNSUPPORTED`.
9. If intersections exist but no allowed pair exists, block with
   `KDNA_HOST_CAPSULE_PAIR_UNSUPPORTED`.

No step may silently add Plan acceptance for Capsule 1 or Host 1. A Plan that
accepts only Capsule 2 blocks against a legacy Host. If a Plan explicitly
accepts Capsule 1 and Host 1, a deterministic Capsule 2-to-1 adapter may be
used and must be named `kdna-capsule-2-to-1/v1` in Trace. The delivery P is
then calculated over the actual delivered Capsule 1.

## 5. Agent Host 2 boundary

Host 2 carries Capsule 2 only in this contract revision. Before invoking a
provider or model, the receiving Host boundary MUST:

1. parse one JSON request and validate it against
   `agent-host-2-request.schema.json`;
2. validate the embedded Capsule against `runtime-capsule-2.schema.json`;
3. require equality among `authority.asset_id`, `asset.asset_id`, and
   `capsule.asset.asset_id`;
4. require `runtime_contract.capsule_version == capsule.version == "2.0"`;
5. recompute P over the exact embedded Capsule with
   `kdna-capsule-jcs-v1`;
6. compare recomputed P with
   `runtime_contract.capsule_delivery_digest`;
7. reject the request before provider execution if any check fails.

Schema validation alone cannot prove equality or recompute a digest. These are
mandatory semantic validation steps.

Before sending the request, the Runner must also require exact equality
between the request task and asset identity and the validated Plan 1.0 values.
The Host cannot infer this Plan correlation because the complete Plan is not
inside the Host request.

### 5.1 Correlated response and `runtime_receipt`

A Host 2 success boundary returns one object conforming to
`agent-host-2-receipt.schema.json`. Its root `protocol` and `request_id` echo
the request. The required `runtime_receipt` records:

- Capsule version `2.0`;
- profile `kdna-capsule-jcs-v1`;
- the sender-claimed P;
- the Host-recomputed P;
- the echoed P;
- `capsule_delivery_comparison: matched`;
- passed Capsule schema validation and matched asset identity correlation;
- provider execution status;
- conservative semantic-consumption and model-identity facts.

The sender-claimed, Host-recomputed, and echoed P values must all be equal.
A structurally valid receipt with unequal values is semantically invalid.
Receipt validation must also correlate the root `request_id` to the request.

`outcome` is present as a non-null result if and only if
`provider_execution_status` is `completed`. For `failed`, `cancelled`,
`timed_out`, or `not_started`, `outcome` is required and must be `null`.
Capsule schema failure, identity mismatch, or P mismatch occurs before this
accepted runtime boundary and MUST NOT produce a conforming success
`runtime_receipt`. The transport may return a separately specified correlated
error envelope; this contract records that failure in JudgmentTrace and does
not mislabel it as an accepted receipt.

`semantic_consumption` is fixed to `not_observed` with a `null` basis. P
equality cannot upgrade it. Model identity is either a non-empty
Host-reported value with basis `host_reported`, or `null` with basis
`not_observed`; the protocol never invents a model name.

## 6. JudgmentTrace 1.0

Trace 1.0 records execution facts without rewriting or interpreting old
Trace 0.9 objects. A producer must build and validate a Trace 1.0 object for
every Plan 1.0 terminal path: completed, blocked, failed, cancelled, or timed
out.

The Trace always records:

- the Plan digest profile/value/comparison;
- all Plan, Core, and Host offers plus capability basis;
- negotiation selection or a blocking issue code;
- named A/C/E digest evidence with comparison facts;
- named P delivery evidence;
- the exact Host 2 correlated response receipt when one was accepted;
- delivery, semantic consumption, provider execution, conformance, and model
  identity as separate facts;
- structured errors and nullable result evidence.

For P:

- `matched` requires sender-observed, Host-recomputed, and Host-echoed P plus
  a correlated request ID;
- `mismatched` records the three observed values and causes failure before
  provider execution;
- `not_delivered` permits a sender-computed P but has no Host P or request ID;
- `not_observed` is used for a delivery path that has no P echo evidence;
- `unavailable` requires all P values to be `null`.

A completed Trace requires matched Plan integrity, successful A/C/E evidence
(`matched` or `not_compared`, never `mismatched` or `unavailable`), a selected
supported protocol/Capsule pair, and non-null result evidence. Its A/C/E set,
selected pair, P values, request ID, Host receipt, model-identity fact, and
result digest must correlate with the exact request and receipt.

When `result_ref` is non-null, `kdna-result-jcs-v1` means SHA-256 over the
UTF-8 RFC 8785 JCS serialization of the exact non-null Host response
`outcome`, with no trailing newline. This named result digest is not A, C, E,
or P and must not be substituted for any of them.

For semantic consumption, Trace 1.0 has no positive state in this revision.
It always records `not_observed`. Host completion and a matched P prove a
technical boundary event, not that a model used the judgment context.

## 7. Source-directory rejection

Plan 1.0 requires `projection_request.require_packaged_asset: true`. A planner
must reject a source-directory request or produce a terminal blocked Trace
with `KDNA_ASSET_FILE_REQUIRED` before authorization, projection, negotiation
delivery, or Host invocation. A source-directory preview must use a separate
authoring type, set `runtime_eligible: false`, and cannot be embedded in an
Agent Host request.

## 8. Validation and fixtures

Public fixtures and the executable verifier live in
`conformance/runtime-contract-v1/`. The verifier performs both JSON Schema and
cross-document semantic checks:

- plan-digest recomputation and self-reference exclusion;
- exact negotiation and the supported-pair matrix;
- Capsule 2 schema/identity correlation;
- request P recomputation;
- correlated receipt P equality;
- Trace-to-Plan/request/receipt correlation;
- missing versus present-null behavior;
- source-directory and silent-downgrade rejection.

Passing the schema without passing these semantic checks is not protocol
conformance.
