# KDNA Access Modes

Version: 0.3  
Status: **Pre-release candidate vocabulary**  
Machine-readable authority: [`manifest.schema.json`](../schema/manifest.schema.json)  
Runtime authority: [`kdna-authorization-contract.md`](./kdna-authorization-contract.md)

## 1. Purpose

Every current `.kdna` manifest declares exactly one access value:

- `public`
- `licensed`
- `remote`

The value tells a Runtime which authorization path is possible. It does not
declare content quality, legal permission to redistribute, product maturity,
authorship, endorsement, or whether an Agent actually used the judgment.

## 2. Access Values

| Access | Asset location | Runtime meaning |
|---|---|---|
| `public` | A local `.kdna` file may contain plaintext payload entries. | Core may plan an authorized local load without a decryption entitlement. Host adoption and user scope remain separate. |
| `licensed` | A local `.kdna` file contains protected entries. | The declared entitlement and crypto profiles must produce valid authorization and a scoped in-memory decrypt hook before Core can load. |
| `remote` | The packaged asset stays inside a deployer-controlled Runtime. | Ordinary local consumer entry points fail closed. A remote product authenticates and authorizes the caller, performs server-side loading, and returns only its separately defined client projection. |

All three paths still require format validation. File possession, local
discovery, installation, or workspace presence is not authorization to adopt
or apply its judgment.

## 3. Public

```json
{ "access": "public" }
```

`public` means that KDNA-level decryption is not required. License metadata
still controls copying and redistribution. A Host still starts from an
explicit file or an exact user-approved relation, requests the least suitable
profile, and exposes whether the asset was used.

The Agent receives only the selected Runtime Capsule projection, not a promise
that every payload field is injected.

## 4. Licensed

```json
{
  "access": "licensed",
  "entitlement": { "profile": "password" }
}
```

`licensed` means that protected entries cannot load until the exact entitlement
profile succeeds. Supported profile details are versioned separately in the
authorization and crypto contracts.

Required boundaries:

- secrets never belong in argv, environment variables, repository files,
  traces, reports, or plaintext activation metadata;
- long-lived credentials and device private keys belong in an approved
  SecretStore; one-time credentials use a bounded protected input channel;
- decrypted entries and CEKs remain in memory;
- an unknown, expired, revoked, mismatched, or unsupported entitlement fails
  closed;
- the Agent receives only a Runtime Capsule projection;
- technical access does not override the asset's legal license.

The legacy `kdna.encryption.licensed-entry` receipt flow may be supported for
compatibility. New protected exports target the separately versioned
`kdna.envelope.aead` candidate. Account and organization profiles use the
RFC-0019 external-key grant flow and do not silently fall back to a password or
legacy receipt.

## 5. Remote

```json
{ "access": "remote" }
```

`remote` means that the `.kdna` asset is loaded only inside a trusted
server-side Runtime. It does not mean that KDNA itself supplies a hosted
service.

The reference Core remote-runtime entry point proves only server-internal,
single-asset loading for a deployer that controls the packaged bytes. The
embedding product remains responsible for network authentication, caller
entitlement, rate limits, task minimization, disclosure policy, and ensuring
that the full server-side Capsule is never returned to the Agent client.

Watermarking and extraction detection are optional product policies, not Core
guarantees. A remote product must disclose any such policy separately.

## 6. Changes Between Access Values

Changing `access` creates new asset bytes and therefore a new content/package
identity. Existing evidence, receipts, attachments, and authorization
decisions do not carry over automatically. A publisher must version,
redistribute, and reauthorize the new asset according to its public release
policy.

Publishing plaintext cannot be undone by later changing the manifest to
`licensed` or `remote`.

## 7. Compatibility and Non-Promises

This candidate vocabulary does not promise:

- a public registry or marketplace;
- an AIKDNA-hosted entitlement or remote-runtime service;
- automatic multi-asset composition;
- offline availability for every licensed profile;
- a specific CLI activation command;
- full-content delivery to an Agent;
- copy prevention, model-training prevention, or universal watermarking.

See also:

- [`kdna-authorization-contract.md`](./kdna-authorization-contract.md)
- [`kdna-crypto-profiles.md`](./kdna-crypto-profiles.md)
- [`kdna-secret-store.md`](./kdna-secret-store.md)
- [`kdna-runtime-projection.md`](./kdna-runtime-projection.md)
- [`../docs/REMOTE_MODE.md`](../docs/REMOTE_MODE.md)
