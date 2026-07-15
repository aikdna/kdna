# KDNA Specifications

> Historical/spec-work area. The current KDNA Core launch path is documented
> in `docs/start-here.md`, `docs/try-kdna.md`, `docs/core/file-format.md`, and
> `docs/core/load-profiles.md`. Older distribution, evaluation, license,
> entitlement, and crypto documents in this folder are not active KDNA Core
> launch contracts unless a current release document explicitly promotes them.

Supplementary specification documents for the KDNA protocol.

## Reading Order

The core protocol specification is in `SPEC.md` at the repository root. Start there.

### File Format & Distribution

| #   | Document                 | What it covers                                                                                            |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| 1   | `kdna-file-format.md`    | The `.kdna` ZIP container format (v1.0-rc). The single-file JSON format is REJECTED and must not be used. |
| 2   | `kdna-package-format.md` | Dev source directory format (SUPERSEDED by asset-first .kdna model). Retained for reference.              |
| 3   | `package-profiles.md`    | Dev source vs .kdna asset profiles and conversion                                                         |
| 4   | `load-profiles.md`       | Loading behavior specifications for different agent runtimes                                              |

### Archived Distribution Work

| #   | Document                      | What it covers                                                                                                                                                       |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | (archived) `kdna-registry.md` | Pre-v1 distribution index format (`domains.json`) and API. **Registry is out of scope for KDNA Core** — see `specs/archive/kdna-registry.md` for historical context. |
| 6   | `kdna-access-modes.md`        | Access control: public / licensed / remote                                                                                                                           |
| 7   | `kdna-license.md`             | KDNA Commercial License (KCL) terms                                                                                                                                  |
| 8   | `LICENSE-KCL-1.0.md`          | KCL 1.0 full license text                                                                                                                                            |

### Quality & Governance

| #   | Document                      | What it covers                                                 |
| --- | ----------------------------- | -------------------------------------------------------------- |
| 9   | Archived evaluation gate spec | Evaluation evidence requirements and CI gate rules             |
| 10  | `human-lock.md`               | Optional Human Lock provenance protocol                        |
| 11  | `human-lock-gate-design.md`   | Human Lock gate design specification                           |
| 12  | `fidelity-protocol.md`        | RFC-0010: KDNA Fidelity Protocol — measuring judgment transfer |
| 13  | `fidelity-result.schema.json` | Schema for fidelity measurement results                        |
| 14  | `evidence-trace.schema.json`  | Schema for recording what KDNA triggered during a judgment     |
| 15  | `route-result.schema.json`    | Schema for KDNA routing decisions                              |

### Artifacts & Runtime

| #   | Document                        | What it covers                                                    |
| --- | ------------------------------- | ----------------------------------------------------------------- |
| 16  | `RFC-0012-artifact-contract.md` | RFC-0012: KDNA Artifact Contract — ArtifactEnvelope specification |
| 17  | `artifact-envelope.schema.json` | Schema for artifact envelopes                                     |
| 18  | `judgment-trace-schema.json`    | Deprecated 0.1 domain-authoring compatibility trace; not Plan 1.0 authority |
| 19  | `judgment-report-schema.json`   | Schema for human-readable reports generated from a judgment trace |
| 20  | `outcome-record-schema.json`    | Schema for recording whether a judgment was correct in hindsight  |
| 21  | `product-runtime.schema.json`   | Schema for KDNA Product Runtime data                              |
| 22  | `runtime-capsule.md`            | Runtime Capsule 1 compatibility and opt-in Capsule 2 semantics    |
| 23  | `runtime-capsule.schema.json` | Frozen Capsule 1 wire schema (`asset_digest` means E)             |
| 24  | `runtime-capsule.schema.json` | Opt-in Capsule 2 wire schema with explicit A/C/E evidence         |
| 25  | `digest-evidence.schema.json`   | Digest values, bases, expected sources, and comparison facts      |
| 26  | `runtime-contract.md` | Opt-in Plan 1.0, Host 2, negotiation, P receipt, and Trace 1.0 contract |
| 27  | `consumption-plan.schema.json` | Strict single-asset ConsumptionPlan 1.0 with JCS plan integrity |
| 28  | `agent-host-capabilities.schema.json` | Pre-execution Host capability observation |
| 29  | `agent-host-request.schema.json` | Strict Capsule 2 Host request with detached P |
| 30  | `agent-host-receipt.schema.json` | Correlated Host 2 runtime receipt and outcome |
| 31  | `judgment-trace.schema.json` | Authoritative strict JudgmentTrace 1.0 execution evidence |

## Consumption extensions

The Core format remains independent from consumption policy. See
[`docs/consumption-runtime.md`](../docs/consumption-runtime.md) for the public
sidecar boundary and the reference runtime workflow.

### Crypto & Identity

| #   | Document                  | What it covers                                                                        |
| --- | ------------------------- | ------------------------------------------------------------------------------------- |
| 32  | `kdna-crypto-protocol.md` | Cryptographic infrastructure for .kdna encryption, signing, licensing, and revocation |
| 33  | `kdna-identity-key.md`    | Identity key generation, backup, rotation, and license binding                        |
| 34  | `kdna-entitlement-api.md` | Activation, sync, revocation, offline grace, and license audit API contract           |

### Authoring & Tooling

| #   | Document                                 | What it covers                                        |
| --- | ---------------------------------------- | ----------------------------------------------------- |
| 35  | `kdna-asset-card.md`                     | KDNA Asset Card specification                         |
| 36  | `cli-license-identity-skeleton.md`       | CLI license and identity skeleton                     |
| 37  | `authorization-subscription-metadata.md` | Authorization and subscription metadata specification |
| 38  | `enum-tables.md`                         | Enumerated value reference tables                     |

### Improvement & Evolution

| #   | Document                           | What it covers                        |
| --- | ---------------------------------- | ------------------------------------- |
| 39  | `improvement-proposal-schema.json` | Schema for KDNA improvement proposals |
| 40  | `stage-definition.schema.json`     | Schema for stage definitions          |
| 41  | `RFC-0012-artifact-contract.md`    | (See also Artifacts section above)    |

For app and runtime integration, read `docs/app-runtime-contract.md` after `docs/runtime-routing.md`.

Runtime contract examples live in `examples/app-runtime-contract/` and can be checked with:

```bash
npm run validate:runtime-contract
```
