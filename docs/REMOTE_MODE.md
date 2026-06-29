# KDNA Remote Mode — Design Specification

**Status:** Proposed — v0.1 (roadmap-2026.md Story 16)
**Implements:** roadmap-2026.md §5.1 Story 16; design contract for Story 18
(remote server reference implementation) and Story 24 (activation server
reference implementation).
**Related specs:** `specs/kdna-access-modes.md §2.3`, `specs/kdna-runtime-projection.md`,
`specs/kdna-entitlement-api.md`

---

## The Self-Hosting Invariant

> **The KDNA protocol MUST NOT assume a single official KDNA server.**
> Any asset creator can run their own remote server. Official KDNA hosting
> is one deployment option, not the protocol requirement.

This invariant is the architectural foundation of the `remote` access mode.
It exists because:

1. **Content neutrality** — KDNA validates format and structure, not judgment
   quality (`decisions/0005`). A single official server that controls which
   assets can run in `remote` mode would make KDNA a content gatekeeper.
   That is not the protocol's role.

2. **Creator sovereignty** — An asset author who publishes a `remote` asset
   retains full ownership and control over their judgment. The server is
   theirs; KDNA provides the protocol rails, not the control point.

3. **Ecosystem resilience** — A protocol whose functioning depends on a
   single operator's infrastructure is not a protocol — it is a hosted
   service with a protocol-shaped wrapper. This is the failure mode the
   registry decision (`decisions/0003`) already prevented.

The invariant applies equally to both server types in this document:
the **activation server** (license management) and the **projection server**
(runtime judgment delivery). Both must be self-hostable by any creator.

---

## Scope

This document defines the design of the two server-side components required
by `access: "remote"` and `access: "licensed"` assets:

| Server | Purpose | Implements |
|--------|---------|------------|
| **Activation server** | License activation, sync, revocation | `specs/kdna-entitlement-api.md` |
| **Projection server** | Task-scoped judgment delivery | `specs/kdna-runtime-projection.md` |

Both are separate deployable units. A creator who only sells `licensed` assets
(full content delivered locally after license check) needs only the activation
server. A creator who sells `remote` assets (content never leaves the server)
needs both.

---

## Access Mode Recap

| Mode | Content delivery | Server required | Who runs the server |
|------|-----------------|-----------------|---------------------|
| `public` | Full content, local | None | — |
| `licensed` | Full content, local after license check | Activation server | Asset creator (or KDNA hosted service) |
| `remote` | Task projection only, never full content | Activation server + Projection server | Asset creator (or KDNA hosted service) |

---

## Activation Server

### Role

The activation server answers one question:

> Is this user / device / organisation currently entitled to use this asset?

For `licensed` assets: a valid entitlement lets the local runtime derive the
in-memory decrypt hook.
For `remote` assets: a valid entitlement lets the projection server serve
responses to this caller.

### Protocol contract

The API contract is fully defined in `specs/kdna-entitlement-api.md`. The
`kdna license activate` command calls it as:

```
kdna license activate <domain> --key <license-key> --server <url>
```

`--server <url>` is any HTTP endpoint. The protocol does NOT specify a
default URL. There is no KDNA Inc. URL hard-coded into the CLI or Core.

### What a creator deploys

A creator who wants to sell a `licensed` asset deploys the activation server
and sets the `license.activation_server` field in `kdna.json`:

```jsonc
{
  "access": "licensed",
  "license": {
    "type": "KCL-1.0",
    "activation_server": "https://licenses.yoursite.com/v1/entitlements/activate",
    "sync_server":       "https://licenses.yoursite.com/v1/entitlements/sync"
  }
}
```

The reference implementation (Story 24) will be a deployable open-source
server that any creator can run. KDNA may also offer a hosted version as a
convenience service; using the hosted version is optional.

### Self-hosting requirements

A conforming activation server MUST:

1. Implement the request/response shapes in `specs/kdna-entitlement-api.md`.
2. Return a signed `entitlement` record with `license_id`, `domain`, scope,
   expiry, and `machine_fingerprint`.
3. Expose a `/sync` endpoint for offline-grace refresh.
4. Expose a `/revoke` endpoint so the creator can revoke any grant.
5. NOT require any registration with KDNA Inc. to operate.
6. NOT call back to any KDNA-controlled endpoint during normal operation.

---

## Projection Server

### Role

The projection server delivers task-scoped judgment fragments to authorized
agents. The full `.kdna` content never leaves the server.

### Protocol contract

Fully defined in `specs/kdna-runtime-projection.md`. The request shape is:

```jsonc
{
  "kdna_id": "@creator/domain@version",
  "task":    "review_article",
  "context": "Pre-publish review of a technical blog post",
  "mode":    "judge"
}
```

The server returns a projection — not the full payload:

```jsonc
{
  "task_projection": {
    "diagnosis_focus": [ "..." ],
    "constraints":     [ "..." ],
    "self_check":      [ "..." ]
  },
  "projection_policy": "remote",
  "trace_id": "uuid"
}
```

### What a creator deploys

The projection server holds the `.kdna` asset (the full, plaintext version
of the judgment — this is the private master copy the creator never
distributes). On each authorized request, it loads the asset, selects the
task-relevant fragments, and returns a projection.

The endpoint is declared in `kdna.json`:

```jsonc
{
  "access": "remote",
  "runtime": {
    "endpoint": "https://runtime.yoursite.com/v1/project"
  }
}
```

### Self-hosting requirements

A conforming projection server MUST:

1. Verify entitlement on every request (call the activation server or
   hold a validated entitlement record locally).
2. Load the `.kdna` asset from local storage only — never from an
   external URL at request time.
3. Return a task projection, never the full payload.
4. Implement the extraction-prevention rules in `specs/kdna-runtime-projection.md §5`:
   rate limiting, extraction-pattern detection, no full-structure responses.
5. Emit audit events per `specs/kdna-entitlement-api.md §Audit` — without
   plaintext content.
6. NOT require any registration with KDNA Inc. to operate.
7. NOT call back to any KDNA-controlled endpoint during normal operation.

---

## Deployment Models

Three deployment models are valid. The protocol supports all three equally.

### Model A — Creator self-hosted

The asset creator runs both servers on their own infrastructure. Suitable for:
- Creators with engineering capacity
- Enterprise clients who require data residency
- Creators who want complete operational control

```
Creator's server:
  ├── activation-server/   (Story 24 reference impl)
  └── projection-server/   (Story 18 reference impl)
```

### Model B — KDNA hosted service (convenience layer)

KDNA Inc. offers a hosted version of both servers. Creators register their
asset with the KDNA hosting service, which manages activation and projection
on their behalf. **This is a product built on top of the open-source reference
implementations, not a protocol requirement.**

Creators who use this service:
- Pay a hosting / revenue-share fee (commercial arrangement)
- Retain content ownership — KDNA Inc. never reads the judgment content
- Can migrate to self-hosted at any time by exporting their asset and
  switching `kdna.json` endpoints

### Model C — Third-party hosting

Any third party can offer KDNA-compatible activation and projection hosting.
Marketplace operators, enterprise platform vendors, or community operators
can run the reference implementations and offer them to creators.

KDNA Inc. does not certify or endorse third-party hosts. Format validity
(`kdna validate`) and entitlement validity (signature check on the
entitlement record) are the only trust signals. The hosting provider is
transparent to the protocol.

---

## What KDNA Protocol Layer Controls

The protocol defines:

- The `.kdna` container format
- The `access` field semantics
- The activation request/response contract (`specs/kdna-entitlement-api.md`)
- The projection request/response contract (`specs/kdna-runtime-projection.md`)
- The layer isolation rules (CLI/Core MUST NOT emit content-trust claims)

The protocol does NOT control:

- Which server a creator uses
- What a creator charges for their asset
- Whether a creator's judgment is accurate, safe, or high-quality
- Which deployment model a creator chooses

---

## Layer Isolation Reminder

Per `SPEC.md §13.1` and `KDNA_TRUST_BOUNDARY.md`:

> `trust` is not a Core-emitted property.

The projection server MUST NOT add fields like `recommended`,
`officially_approved`, `high_quality`, or similar content-trust claims to
its response. These are structurally forbidden regardless of which server
is running. The layer isolation regression test (Story 14, shipped in
v0.28.13) guards this on the CLI side; projection server implementations
must apply the same rule.

---

## Design Contract for Story 18 (Projection Server Reference Impl)

The projection server reference implementation (Story 18) MUST:

1. Implement the HTTP API defined in `specs/kdna-runtime-projection.md`.
2. Accept a `.kdna` asset path at startup; never fetch assets from the network.
3. Verify entitlement by calling the activation server endpoint from `kdna.json`.
4. Return task projections only — never full payload.
5. Be deployable with a single `docker run` or `node server.js` invocation.
6. Require zero KDNA Inc. registration to start.
7. Include a `--dry-run` mode for local development without a real entitlement server.
8. Ship with an integration test that exercises the full client → server →
   projection → CLI round-trip against a fixture asset.

---

## Design Contract for Story 24 (Activation Server Reference Impl)

The activation server reference implementation (Story 24) MUST:

1. Implement the full HTTP API defined in `specs/kdna-entitlement-api.md`:
   `activate`, `sync`, `revoke`, and `status` endpoints.
2. Store entitlement records in a local SQLite database (zero external
   dependencies for the simplest deployment path).
3. Sign entitlement records with the creator's Ed25519 identity key
   (generated by `kdna identity init`, Story 19).
4. Be deployable with a single `docker run` or `node server.js` invocation.
5. Require zero KDNA Inc. registration to start.
6. Include a `--dev` mode that issues unlimited local test licenses without
   a real key, for local development.
7. Ship with an integration test that exercises activate → sync → revoke
   against a fixture asset and validates that `kdna license status` reflects
   each state correctly.

---

## Sequencing

Story 16 (this document) → Story 18 (projection server) and Story 24
(activation server) MAY proceed in parallel after this doc is merged.

Story 19 (author signing, Ed25519 identity keys) is a soft prerequisite for
Story 24: the activation server signs entitlement records with the creator's
Ed25519 key. Story 24 CAN be built with a placeholder signing step and
updated when Story 19 ships; it MUST NOT ship to production before Story 19.

---

## Changelog

- 2026-06-28 v0.1: Initial design document. Establishes the self-hosting
  invariant as the architectural foundation of `remote` mode. Defines
  activation server and projection server roles, deployment models, and
  design contracts for Stories 18 and 24.
  Roadmap reference: roadmap-2026.md §5.1 Story 16.
