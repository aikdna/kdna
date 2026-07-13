# KDNA Authorization Contract

Status: Candidate — normative for the implemented JS Core/CLI/Swift subset.
Chat implementation is pending.
Normative: Yes  
Related schema: `../schema/load-plan.schema.json`  
Related specs: `kdna-crypto-profiles.md`, `kdna-secret-store.md`,
`kdna-runtime-projection.md`, `kdna-import-security.md`

## 1. Scope

This contract defines the runtime authorization behavior for KDNA consumers.
It is the protocol source for Chat, CLI, JS Core, Swift Core, Studio export,
agent adapters, and future runtimes.

A conforming KDNA consumer MUST NOT decide authorization state directly from
raw manifest fields. It MUST request a LoadPlan from KDNA Core or a conforming
implementation.

## 2. Access Values

The canonical protocol access values are:

| Access | Meaning |
|---|---|
| `public` | Local file can be validated and loaded without entitlement. |
| `licensed` | Local file requires a credential, receipt, account, or organization entitlement before protected content can be loaded. |
| `remote` | Full content is not loaded locally; a remote runtime returns task-scoped projections. |

Legacy aliases:

| Legacy value | Canonical value | Requirement |
|---|---|---|
| `open` | `public` | MAY be accepted as legacy input; MUST NOT be emitted as canonical output. |
| `protected` | `licensed` | MAY be accepted as legacy input; SHOULD map to `entitlement.profile = password` when unambiguous. |
| `runtime` | `remote` | MAY be accepted as legacy input; MUST NOT be emitted as canonical output. |

Unknown access values MUST fail closed with `KDNA_ACCESS_MODE_UNKNOWN`.

## 3. Entitlement Profiles

For `licensed` assets, `entitlement.profile` defines how the runtime obtains
permission and decryption material.

| Profile | Status | Meaning |
|---|---|---|
| `password` | Implemented (JS Core/CLI) | User passphrase unlocks a protected local asset. |
| `local_receipt` | Implemented (JS Core; CLI delegates to Core) | Signed local receipt authorizes loading. |
| `account` | Implemented (JS Core/CLI/Swift) | Account service authorizes a device-bound external key grant under RFC-0019. |
| `org` | Future | Organization or SSO claims authorize loading. |
| `purchase_receipt` | Future | Third-party purchase receipt is exchanged for entitlement. |
| `device_bound` | Superseded as a standalone profile | Device binding is a required mechanism of the RFC-0019 `account` flow, not a password fallback or separate entitlement identity. |

Unknown entitlement profiles MUST fail closed with
`KDNA_ENTITLEMENT_PROFILE_UNKNOWN`.

## 4. Layer Boundaries

These concepts MUST NOT be collapsed:

| Concept | Answers | Must not mean |
|---|---|---|
| `access` | How is the asset consumed? | Legal license, quality, or endorsement. |
| `license` | What legal/commercial terms apply? | Technical unlock state. |
| `entitlement` | Who may unlock or project now? | Content correctness or endorsement. |
| `digest` | Do bytes match declared hashes? | Authorship or trust. |
| `signature` | Did a key sign this version? | Quality or official approval. |
| `trust` | Will this user/runtime rely on it? | A Core-generated property. |

Core and CLI MUST NOT emit `recommended`, `officially_approved`,
`high_quality`, or equivalent positive content-trust claims as authorization
results.

## 5. LoadPlan

LoadPlan is the only supported consumer-facing planning result before loading
or decrypting judgment content.

Minimum states:

| State | Meaning |
|---|---|
| `ready` | Asset can be loaded now. |
| `needs_password` | `licensed/password` asset lacks a password. |
| `needs_license` | Required receipt or activation is missing. |
| `needs_account` | Account authorization is required. |
| `needs_org_auth` | Organization or SSO authorization is required. |
| `needs_runtime` | Remote runtime is required. |
| `offline_grace` | Asset can load now but must sync before grace expires. |
| `expired` | Entitlement expired. |
| `revoked` | Entitlement revoked. |
| `invalid` | Format, integrity, signature, crypto, access, entitlement, or policy check failed. |

Minimum required actions:

| Action | Meaning |
|---|---|
| `none` | No user action required. |
| `load` | Load directly. |
| `enter_password` | Prompt for a passphrase. |
| `install_receipt` | Install a local receipt. |
| `sign_in_or_activate` | Sign in or activate through an entitlement service. |
| `sync` | Sync entitlement state. |
| `connect_runtime` | Connect to a remote runtime endpoint. |
| `migrate_legacy` | Explicitly import or migrate a legacy source tree. |
| `block` | Block install or load. |

Current JS Core may expose a narrower v0.1 subset while the full schema is
expanded. It MUST remain fail-closed for states it cannot evaluate.

For RFC-0019 account assets, a plain object that claims `status: active` is not
authorization. Only a grant whose signature, time bounds, account, device,
asset identity, version, digest, encrypted entry, and key wrapping have been
verified by Core can move a LoadPlan to `ready` or `offline_grace`.

## 6. Stable Issue Codes

Implementations MUST use stable issue codes for localization, diagnostics, and
conformance. Initial issue codes:

- `KDNA_OK`
- `KDNA_AUTH_PASSWORD_REQUIRED`
- `KDNA_AUTH_ENTITLEMENT_REQUIRED`
- `KDNA_AUTH_ACCOUNT_REQUIRED`
- `KDNA_AUTH_ORG_REQUIRED`
- `KDNA_AUTH_REMOTE_RUNTIME_REQUIRED`
- `KDNA_AUTH_OFFLINE_GRACE_ACTIVE`
- `KDNA_AUTH_OFFLINE_GRACE_EXPIRED`
- `KDNA_AUTH_EXPIRED`
- `KDNA_AUTH_REVOKED`
- `KDNA_AUTH_CLOCK_ROLLBACK`
- `KDNA_AUTH_ROLLBACK_DETECTED`
- `KDNA_FORMAT_INVALID`
- `KDNA_FORMAT_LEGACY_SOURCE_TREE`
- `KDNA_FORMAT_FORBIDDEN_ENTRY`
- `KDNA_INTEGRITY_DIGEST_FAILED`
- `KDNA_INTEGRITY_SIGNATURE_FAILED`
- `KDNA_CRYPTO_PROFILE_UNSUPPORTED`
- `KDNA_ACCESS_MODE_UNKNOWN`
- `KDNA_ENTITLEMENT_PROFILE_UNKNOWN`
- `KDNA_REMOTE_NOT_SUPPORTED`

Compatibility implementations MAY additionally emit namespaced transitional
codes such as `KDNA_AUTH_VALIDATION_FAILED`, but final cross-implementation
goldens SHOULD converge on the list above.

## 7. Entitlement State

Entitlement state MUST live outside the `.kdna` asset.

Entitlement records SHOULD include:

- receipt or activation version;
- issuer;
- license or entitlement ID;
- subject account/device/org fields;
- asset ID, UID, and digest;
- rights;
- expiration;
- offline validity;
- revocation endpoint and status version;
- signature.

Entitlement secrets MUST NOT be logged, included in traces, exported reports,
screenshots, or debug diagnostics.

An external grant MUST NOT contain the issuer root or the asset CEK. Core MUST
unwrap the CEK only in memory, zeroize it when the authorization session is
disposed, and return only a Runtime Capsule to Agent-facing consumers. The
account flow MUST NOT fall back to the password profile.

## 8. Revocation

Asset revocation and entitlement revocation are separate.

Asset revocation targets an asset version, digest, author key, issuer key, or
distribution metadata.

Entitlement revocation targets a user, account, device, organization, or
license ID.

A valid asset can be inaccessible to a revoked user. A revoked asset version can
be blocked even for a user with a previously valid entitlement.

## 9. Fail-Closed Rules

Consumers MUST fail closed for:

- unknown access values;
- unknown entitlement profiles;
- unknown crypto profiles;
- unsupported signature algorithms when a signature is required;
- digest mismatch;
- invalid signature when a signature is required;
- expired entitlement;
- revoked entitlement;
- offline grace expiry;
- clock rollback beyond allowed tolerance;
- entitlement status rollback;
- forbidden runtime container entries;
- malformed archive or payload.

## 10. Product Boundary

Chat MUST render UI from LoadPlan. Chat MUST NOT become the source of access
mode definitions, entitlement profile definitions, crypto profile decisions, or
fail-closed semantics.

Studio MUST export assets that conform to this contract. Studio MUST NOT emit
app-private encrypted formats as canonical `.kdna` assets.

CLI MUST provide the diagnostic control plane for the same contract.

Agent adapters MUST only load licensed assets when Core/CLI returns
`can_load_now: true`.
