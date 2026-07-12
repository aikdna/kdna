# KDNA Remote Access

**Status:** Remote access mode is part of the public KDNA access model. The
projection and entitlement contracts are candidate interoperability contracts;
the public remote and activation servers are experimental self-hostable
reference implementations.

This page describes current public boundaries. It is not a hosted-service
announcement.

## Self-Hosting Invariant

KDNA remote access must not depend on one official server.

- An asset author or deployer can operate the runtime.
- A compatible third party can implement the public contracts.
- No AIKDNA URL is required by the protocol.
- AIKDNA does not currently provide a public hosted remote-loading service.

## Three Access Modes

| Access | Where full judgment exists | Agent receives |
|---|---|---|
| `public` | In the local asset | Profile-selected Runtime Capsule |
| `licensed` | Encrypted in the asset; decrypted in authorized runtime memory | Profile-selected Runtime Capsule |
| `remote` | On the deployer's server | Task-scoped remote projection / Capsule |

The author declares the access mode. KDNA Core validates and enforces the
declared contract; it does not judge the content or choose a business model.

## Remote Consumption Flow

```text
Agent or application
  → inspect public metadata
  → plan-load
  → receive needs_runtime and endpoint policy
  → present entitlement to the configured runtime
  → runtime validates entitlement and task
  → runtime loads the protected asset server-side
  → runtime returns a task-scoped projection
  → compatible client emits/consumes a Runtime Capsule and Trace
```

The full judgment payload is not returned to the caller. The server must not
turn remote mode into an endpoint for raw asset extraction.

## Public Reference Components

- [`@aikdna/kdna-remote-server`](https://github.com/aikdna/kdna-remote-server)
  demonstrates a self-hosted projection endpoint.
- [`@aikdna/kdna-activation-server`](https://github.com/aikdna/kdna-activation-server)
  demonstrates entitlement activation and synchronization.
- [`@aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) provides the
  remote-mode client path.

These implementations are useful for development and interoperability
testing. Their existence does not make a hosted platform part of KDNA Core and
does not guarantee production suitability for every deployment.

## What Remote Access Protects

Remote access is designed so the full judgment payload does not have to be
delivered to the caller. A conforming server should:

- keep the protected asset on deployer-controlled infrastructure;
- validate entitlement before projection;
- return only task- and profile-scoped material;
- reject bulk extraction patterns;
- avoid plaintext judgment in logs and traces;
- provide auditable execution metadata without content leakage.

## What It Does Not Automatically Protect

Remote mode does not by itself make the following confidential:

- the task sent by the caller;
- context or business data included in the request;
- model-provider requests made by a deployment;
- network metadata, logs, or infrastructure controlled by the deployer;
- information that can be inferred from repeated authorized projections.

Deployers remain responsible for transport security, authentication, data
retention, model-provider policy, rate limits, observability, abuse controls,
and applicable law.

## Protocol Boundaries

KDNA Core defines the access value and loading contract. Runtime and
application layers define deployment policy. Payment, billing, marketplace,
customer support, and provider selection are not KDNA Core responsibilities.

Normative and candidate contracts:

- [Access modes](../specs/kdna-access-modes.md)
- [Authorization contract](../specs/kdna-authorization-contract.md)
- [Runtime projection](../specs/kdna-runtime-projection.md)
- [Entitlement API](../specs/kdna-entitlement-api.md)
- [Runtime Capsule](../specs/runtime-capsule.md)

For current maturity, see [Status](./status.md) and [Maturity](./maturity.md).
