# KDNA Entitlement API

Version: 0.1
Status: Draft / CLI MVP implemented

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
~/.kdna/licenses/<scope-name>.json
```

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

## 4. Activation Request

The activation endpoint SHOULD be:

```http
POST /v1/entitlements/activate
Content-Type: application/json
```

Request body:

```json
{
  "domain": "@aikdna/writing_pro",
  "license_key": "KDNA-LIC-...",
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
| `domain` | Yes | Scoped asset name, for example `@scope/name`. |
| `license_key` | Yes | Secret activation key. Never log this field. |
| `machine_fingerprint` | Yes for machine-bound licenses | Client device fingerprint. |
| `client` | Yes | Calling client, for example `kdna-cli`, `kdna-studio-cli`, `kdna-vscode`, or any third-party consumer of the protocol. |

Optional fields are for account/device management and analytics. Servers MUST
ignore unknown fields for forward compatibility.

## 5. Activation Response

A successful response returns an activation object:

```json
{
  "version": "1.0",
  "license_id": "lic_abc123",
  "license_key": "KDNA-LIC-...",
  "domain": "@aikdna/writing_pro",
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
  "activation_server": "https://license.example.com/v1/entitlements/activate",
  "sync_server": "https://license.example.com/v1/entitlements/sync"
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
      "domain": "@aikdna/writing_pro",
      "license_key": "KDNA-LIC-...",
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
POST /v1/entitlements/sync
Content-Type: application/json
```

Request body:

```json
{
  "domain": "@aikdna/writing_pro",
  "license_key": "KDNA-LIC-...",
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
  "domain": "@aikdna/writing_pro",
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
POST /v1/entitlements/revoke
Content-Type: application/json
Authorization: Bearer <admin-token>
```

Request:

```json
{
  "license_id": "lic_abc123",
  "domain": "@aikdna/writing_pro",
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
~/.kdna/licenses/<scope-name>.json
```

Example:

```json
{
  "version": "1.0",
  "license_id": "lic_abc123",
  "license_key": "KDNA-LIC-...",
  "domain": "@aikdna/writing_pro",
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
  "activation_server": "https://license.example.com/v1/entitlements/activate"
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
  "domain": "@aikdna/writing_pro",
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
kdna license activate @aikdna/writing_pro \
  --key KDNA-LIC-... \
  --server https://license.example.com/v1/entitlements/activate

kdna license sync @aikdna/writing_pro \
  --server https://license.example.com/v1/entitlements/sync
```

