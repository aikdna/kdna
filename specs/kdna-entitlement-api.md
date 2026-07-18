# KDNA Entitlement API

Version: 0.2
Status: Active legacy-receipt contract; RFC-0019 account-device flow is separate

This specification defines the production contract for activating, syncing,
revoking, and auditing licensed KDNA assets.

It complements:

- `kdna-access-modes.md`
- `kdna-crypto-protocol.md`
- `kdna-license.md`
- `LICENSE-KCL-1.0.md`

## 1. Scope

The Entitlement API answers one question:

> Is this user, account, device, or organization currently allowed to use this
> `.kdna` asset?

For `access: "licensed"` assets, a valid entitlement allows the local runtime to
derive an in-memory decrypt hook for protected entries.

For `access: "runtime"` assets, a valid entitlement allows a server-side runtime
to return a task-scoped projection.

The entitlement record is never part of the canonical `.kdna` asset. It is stored
outside the asset, for example:

```text
~/.kdna/licenses/<implementation-defined-id>.json
```

The legacy receipt contract below remains supported for existing license-key
assets. Account/device encrypted assets use the separate RFC-0019 external key
grant flow in Section 11. The two flows are not wire-compatible, and account
assets MUST NOT silently fall back to the legacy password/receipt profile.

## 2. Security Rules

Clients and servers MUST follow these rules:

1. `license_key` is secret and MUST NOT be printed, logged, included in trace
   exports, or embedded in `.kdna` assets.
2. Decrypted KDNA entries MUST remain in memory and MUST NOT be written to cache
   or persisted as canonical files.
3. Revoked, expired, machine-mismatched, or offline-grace-expired entitlements
   MUST fail closed.
4. License status metadata MUST live outside the `.kdna` file.
5. Audit events MAY include `license_id`, domain, status, issue codes, and
   server type, but MUST NOT include `license_key`, decrypted content, or raw
   protected entries.

## 3. Client Commands

The CLI reference commands are:

```bash
kdna license activate <domain> --key <license-key> --server <url>
kdna license sync [domain] [--server <url>]
kdna license status [domain] [--json]
kdna license install <license.json>
```

`--server <url>` is an exact activation or sync endpoint URL. For local testing,
the CLI MAY also accept a `file://` entitlement fixture.

For RFC-0019 account/device assets, the preferred activation command opens the
issuer's browser flow and keeps device private keys in the platform
SecretStore. A headless client may read a one-time activation credential from
standard input. It MUST NOT accept that credential as an ordinary command-line
argument.

## 4. Activation Request

The activation endpoint SHOULD be:

```http
POST /entitlements/activate
Content-Type: application/json
```

Request body:

```json
{
  "domain": "kdna:aikdna:writing-pro",
  "license_key": "<license-secret>",
  "machine_fingerprint": "<sha256 fingerprint>",
  "client": "kdna-cli",
  "client_version": "0.17.0",
  "agent": "codex",
  "account_id": "acct_123",
  "device_label": "MacBook Pro"
}
```

Required fields:

| Field | Required | Description |
|-------|----------|-------------|
| `domain` | Yes | Exact `asset_id` from the KDNA Core manifest, for example `kdna:aikdna:writing-pro`. Its grammar is authoritative in Core's published `manifest.schema.json`. |
| `license_key` | Yes | Secret activation key. Never log this field. |
| `machine_fingerprint` | Yes for machine-bound licenses | Client device fingerprint. |
| `client` | No | Informational calling-client label, for example `kdna-cli` or a third-party consumer. Servers MUST NOT use it as authorization authority. |

Optional fields are for account/device management and analytics. Servers MUST
ignore unknown fields for forward compatibility.

## 5. Activation Response

A successful response returns an activation object:

```json
{
  "version": "1.0",
  "license_id": "lic_abc123",
  "license_key": "<license-secret>",
  "domain": "kdna:aikdna:writing-pro",
  "issued_to": "buyer@example.com",
  "issued_at": "2026-05-27T00:00:00.000Z",
  "expires_at": "2027-05-27T00:00:00.000Z",
  "status": "active",
  "revoked": false,
  "require_machine_binding": true,
  "machine_fingerprint": "<sha256 fingerprint>",
  "require_online_check": true,
  "offline_grace_days": 7,
  "allowed_agents": ["claude_code", "codex", "opencode"],
  "activation_server": "https://license.example.com/entitlements/activate",
  "sync_server": "https://license.example.com/entitlements/sync"
}
```

The response MAY be wrapped:

```json
{ "activation": { "...": "..." } }
```

or:

```json
{ "license": { "...": "..." } }
```

Local fixture files MAY contain:

```json
{
  "activations": [
    {
      "domain": "kdna:aikdna:writing-pro",
      "license_key": "<license-secret>",
      "license_id": "lic_abc123",
      "status": "active"
    }
  ]
}
```

### Field Semantics

| Field | Required | Semantics |
|-------|----------|-----------|
| `version` | Yes | Activation schema version. |
| `license_id` | Yes | Stable non-secret license identifier. Safe for audit. |
| `license_key` | Client local only | Secret key used by licensed encrypted-entry profile. Server MAY echo it; clients MUST NOT log it. |
| `domain` | Yes | Must match the requested domain. |
| `issued_to` | Recommended | Human/account display value. |
| `issued_at` | Recommended | ISO timestamp. |
| `expires_at` | Optional | If in the past, client MUST reject. |
| `status` | Yes | `active`, `expired`, `revoked`, `suspended`, or `trial`. |
| `revoked` | Recommended | Boolean explicit revocation flag. |
| `require_machine_binding` | Yes | If true, client MUST verify fingerprint match. |
| `machine_fingerprint` | Required when bound | Fingerprint authorized for this activation. |
| `require_online_check` | Yes | If true, client MUST enforce offline grace. |
| `offline_grace_days` | Yes if online check required | Number of days after successful sync before fail-closed. |
| `allowed_agents` | Recommended | Agent/client allowlist. |
| `activation_server` | Recommended | Endpoint used for future activation refresh. |

For `kdna.grant.external-key`, clients persist the highest verified
`status_version` and greatest verified wall-clock value in their platform
SecretStore. A lower status version or material clock rollback fails closed;
removing the local entitlement is the only supported reset before a new device
activation.
| `sync_server` | Recommended | Endpoint used for entitlement sync. |

If `require_online_check` is missing in a production response, clients SHOULD
treat it as `true`.

## 6. Client Offline Lease

After a successful activation or sync, the client computes:

```text
offline_valid_until = now + offline_grace_days
```

and stores it in the local activation file.

Rules:

- If `require_online_check` is `true` and `offline_valid_until` is missing or in
  the past, the entitlement is invalid.
- A successful sync refreshes `last_checked_at` and `offline_valid_until`.
- A failed sync does not extend the offline lease.
- R2/R3 assets SHOULD use short leases or online-only access.

## 7. Sync Request

The sync endpoint SHOULD be:

```http
POST /entitlements/sync
Content-Type: application/json
```

Request body:

```json
{
  "domain": "kdna:aikdna:writing-pro",
  "license_key": "<license-secret>",
  "license_id": "lic_abc123",
  "machine_fingerprint": "<sha256 fingerprint>",
  "client": "kdna-cli",
  "client_version": "0.17.0"
}
```

Servers SHOULD return the same activation object shape as activation.

If the license has been revoked, the server MUST return either:

```json
{
  "license_id": "lic_abc123",
  "domain": "kdna:aikdna:writing-pro",
  "status": "revoked",
  "revoked": true,
  "revoked_at": "2026-05-27T00:00:00.000Z",
  "revocation_reason": "payment_failed"
}
```

or an error response with a revocation error code. Clients MUST persist the
revoked state and fail closed.

## 8. Error Responses

HTTP errors SHOULD return:

```json
{
  "ok": false,
  "error": {
    "code": "LICENSE_REVOKED",
    "message": "License has been revoked",
    "retryable": false
  }
}
```

For compatibility with the CLI MVP, servers MAY also return:

```json
{
  "ok": false,
  "error": "License has been revoked"
}
```

Standard error codes:

| Code | Retryable | Meaning |
|------|-----------|---------|
| `INVALID_LICENSE_KEY` | No | Key does not exist or does not match domain. |
| `LICENSE_EXPIRED` | No | Entitlement has expired. |
| `LICENSE_REVOKED` | No | Entitlement was revoked. |
| `LICENSE_SUSPENDED` | Maybe | Temporary suspension. |
| `MACHINE_LIMIT_EXCEEDED` | No | Device limit exceeded. |
| `MACHINE_MISMATCH` | No | Fingerprint does not match bound activation. |
| `ACCOUNT_REQUIRED` | No | Login/account binding required. |
| `RATE_LIMITED` | Yes | Too many activation or sync attempts. |
| `SERVER_UNAVAILABLE` | Yes | Temporary server failure. |

## 9. Revocation Management API

This endpoint is for entitlement servers, marketplaces, or enterprise admin
systems. It is not called by ordinary KDNA clients.

```http
POST /entitlements/revoke
Content-Type: application/json
Authorization: Bearer <admin-token>
```

Request:

```json
{
  "license_id": "lic_abc123",
  "domain": "kdna:aikdna:writing-pro",
  "reason": "payment_failed",
  "revoked_by": "billing-system",
  "revoked_at": "2026-05-27T00:00:00.000Z"
}
```

Response:

```json
{
  "ok": true,
  "license_id": "lic_abc123",
  "status": "revoked",
  "revoked": true,
  "revoked_at": "2026-05-27T00:00:00.000Z"
}
```

The next client sync MUST receive the revoked status.

## 10. Local Activation File

Reference clients store one JSON file per domain:

```text
~/.kdna/licenses/<implementation-defined-id>.json
```

Example:

```json
{
  "version": "1.0",
  "license_id": "lic_abc123",
  "license_key": "<license-secret>",
  "domain": "kdna:aikdna:writing-pro",
  "issued_to": "buyer@example.com",
  "issued_at": "2026-05-27T00:00:00.000Z",
  "expires_at": "2027-05-27T00:00:00.000Z",
  "status": "active",
  "revoked": false,
  "require_machine_binding": true,
  "machine_fingerprint": "<sha256 fingerprint>",
  "require_online_check": true,
  "offline_grace_days": 7,
  "last_checked_at": "2026-05-27T00:00:00.000Z",
  "offline_valid_until": "2026-06-03T00:00:00.000Z",
  "activation_server": "https://license.example.com/entitlements/activate"
}
```

This file is an activation record, not a KDNA asset. It MAY contain the
`license_key`, so it MUST be treated as sensitive local state.

## 11. Audit Event

Reference clients SHOULD append a local trace event for license lifecycle
actions.

Example:

```json
{
  "timestamp": "2026-05-27T00:00:00.000Z",
  "event": "license",
  "action": "sync",
  "agent": "kdna-cli",
  "domain": "kdna:aikdna:writing-pro",
  "license_id": "lic_abc123",
  "valid": false,
  "issues": ["License has been revoked"],
  "revoked": true,
  "require_online_check": true,
  "offline_valid_until": "2026-06-03T00:00:00.000Z",
  "server_type": "https",
  "synced": true
}
```

Allowed `action` values:

| Action | Meaning |
|--------|---------|
| `install` | Local activation file installed. |
| `activate` | Activation server accepted a license key. |
| `sync` | Entitlement state refreshed. |
| `load` | Licensed asset loaded after activation. |
| `deny` | Licensed asset load denied. |

Audit events MUST NOT include:

- `license_key`
- decrypted KDNA content
- ciphertext
- raw machine fingerprint, unless enterprise policy explicitly requires it

## 12. Compatibility With CLI MVP

The current CLI MVP implements:

- `kdna license install`
- `kdna license status`
- `kdna license activate`
- `kdna license sync`
- machine binding
- revocation enforcement
- offline grace fail-closed
- local file entitlement fixtures
- trace audit events without `license_key`
- automatic in-memory decrypt hook for licensed `.kdna` loading and verification

The CLI currently posts activation and sync requests to the exact `--server`
URL provided by the caller. Production clients SHOULD pass the concrete endpoint
URL, such as:

```bash
kdna license activate kdna:aikdna:writing-pro \
  --key <license-secret> \
  --server https://license.example.com/entitlements/activate

kdna license sync kdna:aikdna:writing-pro \
  --server https://license.example.com/entitlements/sync
```

## 13. Account/Device External Key Grant

An account/device issuer exposes a device authorization flow under its versioned
API namespace:

```text
POST device-activations
→ user verifies the displayed code in a signed-in browser
→ POST device-activations/{id}/poll with a signed device proof
→ signed kdna.grant.external-key
```

Subsequent synchronization uses a server challenge and a signed proof from the
same device signing key. A successful response returns a replacement signed
grant. A revoked account, entitlement, device, expired challenge, device-limit
violation, or mismatched proof MUST fail closed.

The grant and encrypted asset contracts are defined by RFC-0019 and:

- `external-key-grant.schema.json`;
- `external-grant-envelope.schema.json`;
- `../conformance/external-grant/`.

The issuer derives the asset CEK only inside its trusted key boundary and wraps
it to the requesting device's public agreement key. The CEK MUST NOT be stored
in the asset, entitlement database, object metadata, audit event, log, or
Trace. The client stores device private keys and the current grant in a secure
SecretStore; public status metadata may contain only identifiers, public keys,
time bounds, and secret references.

Core verifies the signed grant and every account/device/asset binding before it
unwraps in memory. Revoked, expired, tampered, digest-mismatched,
version-mismatched, or device-mismatched grants MUST fail closed. Agent-facing
integrations receive only the Runtime Capsule.
