# Apple Native Runtime Integration

Status: Draft  
Normative source: `specs/kdna-authorization-contract.md`,
`specs/kdna-loadplan.schema.json`, `specs/kdna-runtime-projection.md`,
`docs/STUDIO_EXPORT_CONTRACT.md`

## Purpose

This document is the execution contract for native Apple host applications and
Swift packages. It prevents consumer apps, authoring apps, `kdna-app-shared`,
and Swift runtime packages from each defining their own `.kdna` authorization
behavior.

## Package Roles

| Package or app | Role | Must not define |
|---|---|---|
| `kdna-core-swift` | Swift runtime implementation: validate, inspect, plan, authorize, project. | Product UI state or Studio authoring rules. |
| `kdna-studio-swift` | Swift authoring kernel: project, cards, compile, runtime export. | Chat load behavior or app-private `.kdna` formats. |
| `kdna-app-shared` | Shared app presentation/adapters after Core exposes conformance-backed types. | Access values, entitlement profiles, LoadPlan states, crypto profiles. |
| Native consumer app | Import local `.kdna`, render LoadPlan, request credentials, load projections. | Manifest-based authorization decisions. |
| Native authoring app | Call Studio export and validate through Core. | Runtime container variants that Core/CLI cannot inspect. |

## Runtime Container Requirement

Native Studio export MUST produce the current KDNA runtime shape:

```text
mimetype
kdna.json
payload.kdnab
checksums.json
```

Top-level authoring/source entries such as `KDNA_Core.json`,
`KDNA_Patterns.json`, reports, and `source_cards` MUST NOT be emitted as
runtime distribution entries.

## Native Consumer Flow

A native consumer app MUST follow this sequence:

1. Import or reference a local `.kdna` file.
2. Ask Swift Core for a LoadPlan.
3. Render UI from the LoadPlan state and issue codes.
4. Request only the required credential or receipt.
5. Ask Swift Core to load an authorized runtime projection.
6. Pass only the projection to the model context.

A native consumer app MUST NOT infer `ready`, `needs_password`, `needs_license`,
`expired`, `revoked`, or `invalid` from raw manifest fields.

## Shared App Layer

`kdna-app-shared` MAY contain:

- LoadPlan presentation mapping;
- Keychain-backed SecretStore adapters;
- license status view models;
- import/install error presentation.

It MUST import protocol facts from `kdna-core-swift` and this repository's
schemas. It MUST NOT become a second protocol source.

## Current Implementation Evidence

The expected implementation direction is:

- JS Core and CLI expose `plan-load` and authorization conformance fixtures.
- `kdna-core-swift` exposes `KDNARuntime.planLoad` for KDNA source
  directories and packed `.kdna` runtime containers.
- `kdna-core-swift` exposes `KDNARuntime.loadWithCredential` and
  `KDNAJudgmentProjection` for authorized minimal runtime projection.
- `kdna-studio-core`, `kdna-studio-cli`, and `kdna-studio-swift` export runtime
  containers using the canonical four-entry shape.
- Native consumer apps should replace app-side authorization parsing with Swift
  Core LoadPlan rendering.

## Remaining Native Work

Before a native Chat/Studio release claims authorization compatibility:

1. `kdna-app-shared` should add LoadPlan and projection presentation types.
2. Native consumer apps should import `.kdna` through Swift Core, not raw ZIP parsing.
3. Native consumer apps should render LoadPlan states and pass only
   `KDNAJudgmentProjection` content to model context.
4. Native authoring apps should validate exported assets with Swift Core and CLI.
