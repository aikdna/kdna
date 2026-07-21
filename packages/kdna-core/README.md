# @aikdna/kdna-core

> **Status:** Pre-release. This source tree contains the unreleased `0.21.0`
> corrective candidate; the published incumbent is `0.20.0`. Candidate source,
> APIs, and evidence must not be described as already published.

Core library for packaged `.kdna` judgment assets. It implements one current
container contract, authorization planning, integrity evidence, Runtime Capsule
projection, and the correlated Agent Host execution boundary.

## Install

```bash
npm install @aikdna/kdna-core@0.20.0
```

That command installs the published incumbent. Use its release notes for the
exact `0.20.0` contract. The examples below describe the current source
candidate and require its final release coordinate before registry use.

## Pack, validate, plan, and load

Use the package root. Version-qualified entry points and parallel generation
APIs are not part of the public contract.

```js
const {
  pack,
  validate,
  planLoad,
  loadAuthorized,
} = require('@aikdna/kdna-core');

pack('./authoring-source', './asset.kdna');

const validation = validate('./asset.kdna');
if (!validation.overall_valid) {
  throw new Error(validation.problems.join('\n'));
}

const plan = planLoad('./asset.kdna');
if (!plan.can_load_now) {
  throw new Error(`Asset is not loadable: ${plan.required_action}`);
}

const capsule = loadAuthorized('./asset.kdna', {
  profile: 'compact',
  as: 'json',
});

if (
  capsule.type !== 'kdna.runtime-capsule' ||
  capsule.contract_version !== '0.1.0'
) {
  throw new Error('Unexpected Runtime Capsule contract');
}
```

Runtime entry points accept final packaged bytes or a packaged file. Authoring
directories must be packed before they can produce a Runtime Capsule.

`compatibility.min_loader_version` is a strict `x.y.z` loader package
coordinate. `inspect` and `validate` expose it together with
`loader_version` and `loader_compatible`. Structural validation remains
separate from loadability: `planLoad` and every load path block a valid asset
that requires a newer loader with `KDNA_LOADER_VERSION_UNSUPPORTED` before
projection.

## Current candidate Runtime contracts

There is one current responsibility chain:

```text
packaged .kdna
→ validate
→ planLoad
→ authorize
→ Runtime Capsule
→ Consumption Plan
→ Agent Host request and correlated receipt
→ Judgment Trace
```

Every KDNA-owned contract uses an explicit compatibility coordinate:

| Contract | Identity | Compatibility coordinate |
| --- | --- | --- |
| Container manifest | `format_version` | `0.1.0` |
| Payload profile | `profile` + `profile_version` | `kdna.payload.judgment` + `0.1.0` |
| Runtime Capsule | `type` + `contract_version` | `kdna.runtime-capsule` + `0.1.0` |
| Consumption Plan | `type` + `contract_version` | `kdna.consumption-plan` + `0.1.0` |
| Agent Host | `protocol` + `protocol_version` | `kdna.agent-host` + `0.1.0` |
| Judgment Trace | `type` + `contract_version` | `kdna.judgment-trace` + `0.1.0` |

There is no public adapter between competing Capsule or Host generations.
Unsupported compatibility coordinates fail closed.

## Digest responsibilities

Core keeps four digest bases separate:

- **A** — final packaged container bytes;
- **C** — the canonical content tree;
- **E** — the raw `kdna.json` and `payload.kdnab` runtime entry set;
- **P** — the canonical Runtime Capsule delivered to a Host.

Use `computeDigestEvidence()` for A/C/E and
`computeCapsuleDeliveryDigest()` for P. A grant or registry expectation for A
must never be compared with E from `checksums.json`.

## Consumption and Host execution

`buildConsumptionPlan()` creates the single-asset execution plan and its
detached integrity digest. `buildAgentHostRequest()` validates the accepted
Plan digest, observed Host capabilities, Capsule compatibility coordinate,
task, asset identity, budgets, and P before producing a request.

Untrusted Host JSON must enter through `parseRuntimeContractJson()` before
object validation. It rejects duplicate keys, invalid UTF-8, non-JSON numeric
values, trailing input, and excessive input before correlation checks run.

`buildJudgmentTrace()` records delivery, Host execution, budget, result, and
error evidence. A correlated receipt proves a technical boundary event; it
does not prove semantic consumption, behavioral influence, judgment quality,
or model conformance.

If the exact projection or task exceeds an enforceable pre-Host budget,
`buildAgentHostRequest()` fails closed. Use
`buildPreHostBudgetBlockedTrace()` to retain a terminal evidence record without
creating a deliverable Host request.

## Licensed account/device grants

`authorizeExternalKeyGrant()` verifies the issuer signature, time window,
status, account, device, final packaged asset digest A, and encrypted entry.
It returns a branded entitlement and an in-memory decrypt hook. A plain object
such as `{ status: 'active' }` is not authorization.

Keep device private keys in the platform secret store, dispose the returned
session after loading, and expose only the Runtime Capsule to Agent-facing
callers. Account grants never silently fall back to password authorization.

## Projection profiles

`loadAuthorized()` supports `index`, `compact`, `scenario`, and `full`, with
`json` or `prompt` output. The requested profile controls the emitted context
shape; implementations must not label one projection as another.

## Deployer-controlled remote Runtime

Ordinary consumers always receive `needs_runtime` / `connect_runtime` when an
asset declares `access: "remote"`. A deployer that physically controls the
server-side packaged asset uses the separate package subpath:

```js
const {
  loadRemoteRuntimeAsset,
} = require('@aikdna/kdna-core/remote-runtime');

const fullCapsule = loadRemoteRuntimeAsset('./deployed-judgment.kdna');
```

The function accepts one final packaged file path or packaged byte buffer. It
validates and plans one immutable byte snapshot, accepts only a single remote
asset, and returns a full JSON Runtime Capsule for the server's projection
engine. It does not accept caller-selected access, profile, output, dependency,
or inheritance options.

Possession of the deployed asset is the authorization boundary for this
server-side API. The API does not authenticate network callers, verify their
entitlements, make plaintext confidential from the deployer, minimize the
projection returned to a client, or provide an AIKDNA-hosted service. The
embedding Runtime must implement those request and disclosure controls and
must never return the full server-side Capsule to an Agent client.

## Boundary

Core validates technical structure, integrity, authorization, compatibility,
and observed execution facts. It does not rank judgment quality, endorse an
asset, or claim that a model understood or followed loaded judgment.

## License

Apache-2.0
