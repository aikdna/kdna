# KDNA Asset Authorization Strategy

Status: Strategy Draft  
Normative: No  
Source of truth for implementation: `specs/kdna-authorization-contract.md`  
Schema source: `schema/load-plan.schema.json`

## Purpose

This strategy explains how KDNA should protect, authorize, distribute, revoke,
and commercially use `.kdna` judgment assets without turning Chat, Studio, CLI,
or any other product into a separate protocol source.

The immediate product pressure comes from consumer applications, but any one
application is only one runtime. The authorization model must be shared by
Core, CLI, Swift Core, Studio, Agent adapters, and future runtimes.

## Thesis

KDNA should not try to make files uncopyable.

KDNA should keep `.kdna` portable while making protected judgment content usable
only through authorized runtime paths:

> portable asset + verifiable identity + encrypted payload + signed entitlement + governed runtime

The protected object is the legitimate consumption path for a judgment asset,
not an impossible promise that a human or model can never learn from authorized
use.

## Non-Goals

This strategy does not claim that:

- a local file can be made impossible to copy;
- an authorized user cannot summarize, quote, screenshot, leak, or imitate what
  they are allowed to see;
- local decryption remains secure on a fully compromised device;
- KDNA replaces legal agreements, creator licenses, or enterprise policy;
- Chat should become a marketplace, registry, or content-quality authority;
- local authorization should depend on registry trust, marketplace validation,
  or quality badges.

## Core Principles

- `.kdna` remains the canonical user-facing asset file.
- Authorization state lives outside the asset.
- Decrypted entries are memory-only and must not be persisted as extracted JSON.
- Dynamic authorization must fail closed when expired, revoked, suspended,
  machine/device-mismatched, or outside offline grace.
- Authorization is content-neutral: it proves permission to load or project an
  asset, not correctness, quality, safety, or endorsement.
- Protocol-level `access` values remain small and stable:
  `public`, `licensed`, and `remote`.
- Password protection is `licensed/password`, not a fourth access mode.
- High-value assets that cannot expose full plaintext locally should use
  `remote` and return task-scoped projections.

## Distribution Scenarios

### Public Assets

Public `.kdna` assets can be imported and loaded locally through KDNA Core. The
runtime still validates format, manifest, payload, checksums, and any available
signature metadata, but no entitlement is required.

### Licensed Password Assets

Password-protected assets use `access: "licensed"` plus
`entitlement.profile: "password"`. They may work fully offline, but they do not
support dynamic revocation unless wrapped in a separate entitlement model.

### Licensed Receipt Assets

Receipt-backed assets use `access: "licensed"` plus an external signed receipt
or activation record. The receipt is stored outside the `.kdna` file and can
expire, be revoked, or be device-bound according to the authorization contract.

### Account And Organization Assets

Account and organization assets use external entitlement services. The `.kdna`
file remains immutable; membership, subscription, activation, renewal, refund,
and revocation are external state.

### Remote Runtime Assets

Remote assets do not deliver full judgment content to the client. A consumer
runtime sends task context to a KDNA Runtime and receives a task-scoped
projection. Chat 0.1 should recognize `remote` and fail gracefully unless a
remote runtime contract is implemented.

## Product Responsibilities

KDNA Core owns protocol mechanics: validation, LoadPlan, fail-closed decisions,
decrypt hooks, SecretStore integration points, and in-memory projection.

KDNA CLI owns the diagnostic and conformance control plane: inspect, validate,
plan-load, fixture generation, license status, and safe JSON output.

Studio owns authoring and export: choosing access mode, producing conforming
runtime `.kdna` assets, and generating test fixtures. Studio must not define
Chat-specific load behavior.

Chat owns product UX: import, display LoadPlan state, request credentials, call
Core, and render task-scoped projections. Chat must not parse entitlement
validity directly from raw manifest fields.

Agent adapters consume Core/CLI outputs. They must not parse `.kdna` manually
or claim registry, marketplace, quality, or endorsement semantics.

## Honest Security Statement

KDNA access control is designed to prevent unauthorized loading of protected
judgment assets. It does not claim to prevent authorized users from learning,
summarizing, quoting, screenshotting, or behaviorally approximating judgment
exposed to them during legitimate use.

For assets where exposure of the full judgment structure is unacceptable,
authors should use remote runtime mode, where the client receives task-scoped
projections rather than the complete KDNA payload.

## Proposed Decision Record

1. KDNA protects use rights, not file possession.
2. `.kdna` remains portable and canonical.
3. Dynamic permissions are external entitlements, not embedded mutable file
   state.
4. Decryption must be entry-level and memory-only.
5. Protocol-level access values are `public`, `licensed`, and `remote`.
6. Password protection is `licensed/password`.
7. Legal license, protocol access, entitlement, integrity, signature, and trust
   are separate layers.
8. Chat consumes LoadPlan from Core or a conforming implementation.
9. Native apps use SecretStore/Keychain-style storage for long-lived secrets.
10. Remote runtime is required when full local plaintext is unacceptable.

## Open Questions

- Which exact envelope encryption profile becomes canonical after the current
  current public toolchain is sealed?
- Should the default entitlement server be part of AIKDNA's public
  infrastructure or only a reference implementation?
- What are the default offline grace periods for consumer, subscription, and
  enterprise assets?
- Should future remote references use `.kdnaref`, a `.kdna` remote profile, or
  no local file in 0.1?
