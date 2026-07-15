# KDNA Authorization & Subscription Metadata Specification

Version: 0.1
Status: Draft
Depends on: kdna-asset-card.md, kdna-license.md, registry SCHEMA.md 2.3

## 1. Purpose

Define the metadata schema for commercial KDNA assets that enables:
1. **Discovery**: users can filter/search by access mode, price, subscription model
2. **Access control**: CLI and Runtime can enforce license validity
3. **Commerce**: marketplace can display pricing, trials, and update cadence
4. **Audit**: license usage can be tracked without violating privacy

## 2. Access Modes

| Mode | Description | Local Files | Requires | Registry Visibility |
|------|-------------|-------------|----------|---------------------|
| `open` | Free, publicly available | Yes | Nothing | Always |
| `licensed` | Commercial, client-side KDNA files | Yes (encrypted/signed) | License key | With valid license |
| `runtime` | Commercial, server-side projection only | No | Subscription + runtime endpoint | With valid subscription |
| `private` | Organization-internal, not in public registry | Yes | Organization membership | Only to org members |

## 3. Subscription Metadata

### 3.1 Schema

```json
{
  "subscription": {
    "model": "one_time",
    "price": "$49",
    "currency": "USD",
    "billing_period": null,
    "trial_available": true,
    "trial_duration_days": 7,
    "includes_updates": true,
    "update_cadence": "quarterly",
    "max_agents": 3,
    "max_users": 1,
    "commercial_use": "internal_only",
    "refund_policy": "7-day money-back guarantee",
    "auto_renewal": false
  }
}
```

### 3.2 Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | enum | Yes | `free`, `one_time`, `subscription`, `enterprise`, `runtime_api` |
| `price` | string | Yes | Human-readable price, e.g. "$49" or "Custom" |
| `currency` | string | No | ISO 4217 currency code (default: USD) |
| `billing_period` | string | No | `monthly`, `annual`, null for one-time |
| `trial_available` | boolean | No | Whether a free trial is offered |
| `trial_duration_days` | number | No | Trial length in days |
| `includes_updates` | boolean | Yes | Whether price includes updates during the license period |
| `update_cadence` | string | No | `monthly`, `quarterly`, `on_revision`, `as_published` |
| `max_agents` | number | No | Maximum number of concurrent agent instances |
| `max_users` | number | No | Maximum number of licensed users (team/enterprise) |
| `commercial_use` | string | No | `internal_only`, `client_work`, `embedded_product`, `unrestricted` |
| `refund_policy` | string | No | Human-readable refund terms |
| `auto_renewal` | boolean | No | Whether subscription auto-renews |

## 4. License Verification Flow

### 4.1 Client-Side (licensed mode)

```
1. User: kdna install @scope/domain-pro
2. User: kdna license activate @scope/domain-pro --key KDNA-LIC-XXXX --server <activate-url>
3. CLI: POST /entitlements/activate { license_key, domain, machine_fingerprint, client }
4. Server: Validate key, check expiration, check agent/device limits, return activation object
5. CLI: Stores activation metadata outside the asset in ~/.kdna/licenses/
6. Agent: On load, checks activation status, revocation, machine binding, and offline grace before decrypting entries in memory
```

### 4.2 Server-Side (runtime mode)

```
1. User: kdna install @scope/domain-pro --runtime
2. CLI: POST /subscription/activate { domain_id, user_id }
3. Server: Create subscription, return runtime_endpoint + API key
4. CLI: Store runtime config in ~/.kdna/runtime/
5. Agent: On task, POST runtime_endpoint/project { task, context }
6. Runtime: Verify subscription, project domain rules, return TaskProjection
7. Runtime: Log usage for billing, return trace_id
```

## 5. License Key Format

```
KDNA-LIC-{version}-{domain_short}-{random}
Example: KDNA-LIC-1-WPRO-A7B3C9D2
```

- `version`: License format version (1)
- `domain_short`: 4-char domain abbreviation
- `random`: 8-char random identifier

The key is a reference, not a secret. Actual validation is server-side.

## 6. Marketplace Discovery Fields

For the marketplace/registry, these subscription metadata fields enable:

| Feature | Required Fields |
|---------|----------------|
| Filter by price | `subscription.model`, `subscription.price` |
| Show trial badge | `subscription.trial_available` |
| Show update frequency | `subscription.update_cadence` |
| License type filter | `access`, `license.type`, `license.commercial` |
| Per-seat pricing display | `subscription.max_users`, `subscription.price` |
| Refund assurance | `subscription.refund_policy` |

## 7. Usage Tracking (Privacy-Preserving)

For runtime-mode domains, the Runtime tracks:
- `projection_count`: number of times the domain was projected (for billing)
- `domain_version`: which version was used
- `trace_id`: correlation ID for audit (not user-identifiable)

The Runtime MUST NOT track:
- User prompt content
- Agent outputs
- Task descriptions

## 8. Integration with Asset Card

The Asset Card's `subscription` block (see kdna-asset-card.md §3.5) is a subset of this specification. The full subscription metadata lives in the registry entry. The Asset Card displays a simplified view for discovery.

## 9. Validator Rules

1. For `access: "licensed"`: `subscription.model` must be one of `one_time`, `subscription`, `enterprise`
2. For `access: "runtime"`: `subscription.model` must be `subscription` or `runtime_api`; `runtime_endpoint` required
3. `subscription.price` must be non-empty for all commercial (`licensed`/`runtime`) assets
4. `subscription.includes_updates` must be a boolean
5. If `trial_available` is true, `trial_duration_days` must be > 0

---

*This specification extends kdna-asset-card.md and the historical registry SCHEMA.md (2.3).*
