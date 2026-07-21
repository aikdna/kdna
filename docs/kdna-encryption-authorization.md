# KDNA Encryption and Authorization Boundary

> Status: pre-release design and exact-version implementation guide. This page
> does not promise an AIKDNA-hosted licensing, registry, billing, activation,
> or remote-loading service.

Encryption and authorization protect access to judgment content. They do not
certify that the content is correct, authorize an Agent to take external
actions, or let a Host choose an asset without user authority.

## Current access model

The public protocol distinguishes three access paths:

| Access path | Content location | Required decision |
|---|---|---|
| `public` | Packaged `.kdna` file | Integrity, compatibility, and Host attachment policy |
| `licensed` | Protected entries in a packaged `.kdna` file | The same checks plus an exact entitlement decision |
| `remote` | Projection returned by a configured server | The same checks plus server identity, authorization, and response binding |

Exact schema and cryptographic requirements live in
[`kdna-crypto-protocol.md`](../specs/kdna-crypto-protocol.md),
[`kdna-entitlement-api.md`](../specs/kdna-entitlement-api.md), and the associated
conformance fixtures. Check the package release coordinate before relying on a
specific command or algorithm.

## User and Host boundary

The starting point remains one explicit file or one exact user-approved Host
attachment. A license receipt, decryption key, registry record, cached file, or
successful server response does not by itself attach the asset to a task.

A Host must:

1. bind authorization to the exact asset identity, version, digest, access mode,
   and requested projection;
2. fail closed on identity, digest, entitlement, expiry, revocation,
   compatibility, or decryption mismatch;
3. keep decrypted content out of ordinary logs and persistent plaintext files;
4. deliver the exact authorized Runtime Capsule to the Agent boundary;
5. expose active identity, scope, and authorization state to the user, with a
   way to disable, switch, and roll back the attachment.

KDNA authorization grants access to judgment content. Tool, file, network,
payment, deployment, and other action permissions continue to come from the
user and Host.

## Implementation status boundary

The repositories contain public encryption, entitlement, activation, and
remote-reference primitives at different pre-release coordinates. Their
existence and tests are technical facts, not a claim that one production
service or end-user commercial flow is available. Self-hosted server projects
remain independently versioned and must publish their own deployment and
security evidence.

Future hosted distribution, billing, enterprise SSO, marketplace features, or
commercial trust policy require separate product decisions. They are not
implied by the container format.
