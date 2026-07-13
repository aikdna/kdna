# RFC-0014: KDNA Asset Authorization, Entitlement, and LoadPlan

Status: Proposed  
Created: 2026-06-19  
Normative target: `specs/kdna-authorization-contract.md`

## Summary

This RFC proposes the first shared authorization contract for KDNA consumers.
The goal is to prevent Chat, CLI, Studio, JS Core, Swift Core, and agent
adapters from inventing separate authorization semantics.

## Decisions Proposed

1. KDNA protects unauthorized loading, not file possession.
2. `.kdna` remains the canonical portable asset.
3. Dynamic entitlement is external state.
4. `public`, `licensed`, and `remote` are the canonical access values.
5. `open`, `protected`, and `runtime` are legacy aliases only.
6. Password protection is `licensed/password`.
7. Chat consumes LoadPlan; it does not parse authorization directly from raw
   manifest fields.
8. Native apps use SecretStore for long-lived secrets.
9. Remote runtime is required when full local plaintext exposure is
   unacceptable.
10. Source-tree JSON is authoring/legacy import material, not a conforming
    runtime distribution surface.

## Current Baseline

Current public KDNA Core launch assets use:

```text
mimetype
kdna.json
payload.kdnab
checksums.json
```

Future security phases may add signature and encryption metadata. Those phases
must not silently redefine the current v1 baseline.

## LoadPlan Requirement

KDNA Core and conforming implementations must expose a pre-load planning result
before plaintext loading or decryption. LoadPlan separates:

- `state`: current authorization state;
- `required_action`: product next step;
- `issue.code`: stable diagnostic and localization code;
- `can_load_now`: runtime decision;
- `projection_policy`: how judgment may be exposed.

## First Implementation Slice

The first slice should cover:

- `public` ready;
- `licensed/password` missing password and ready-with-password;
- `licensed/local_receipt` skeleton;
- `remote` recognized but not loaded;
- invalid/tampered fail closed;
- legacy aliases mapped or blocked explicitly.

## Out Of Scope

This RFC does not implement:

- marketplace;
- payment;
- revenue share;
- account login;
- organization SSO;
- remote projection service;
- watermarking;
- registry-required local authorization.

## Acceptance Criteria

- JS Core returns schema-valid LoadPlan for public, password, remote, unknown
  access, and tampered fixtures.
- CLI exposes the same plan through a diagnostic command.
- Swift Core returns equivalent states for the same fixtures.
- Chat renders product UI from LoadPlan.
- Studio exports fixtures that exercise the contract.
- Conformance goldens compare JS Core, Swift Core, CLI, and Chat.
