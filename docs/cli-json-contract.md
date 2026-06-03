# CLI JSON Contract

Status: v1.0-rc contract

This document defines the machine-readable outputs that agents, runtimes, IDEs, and registry operators may consume. Human CLI output can change freely. JSON fields listed here are stable for the v1.0-rc line.

## Compatibility Policy

- Fields documented as required MUST remain present until the next major contract.
- New optional fields MAY be added.
- Field meaning MUST NOT change without a contract version bump and migration note.
- Removed or renamed fields require a deprecation window.
- Unknown fields MUST be ignored by consumers.
- Commands that fail in JSON mode SHOULD emit a JSON object with at least `error`.

## Exit Codes

| Code | Name | Meaning |
| --- | --- | --- |
| 0 | `OK` | Command completed successfully. |
| 1 | `VALIDATION_FAILED` | Structure, schema, or generic validation failed. |
| 2 | `INPUT_ERROR` | Bad arguments, missing target, or target not installed. |
| 3 | `TRUST_FAILED` | Digest, signature, license, entitlement, or trust verification failed. |
| 4 | `JUDGMENT_QUALITY_FAILED` | Judgment/eval quality gate failed. |
| 5 | `REGISTRY_ERROR` | Registry lookup, yanked asset, revoked entry, or registry policy failure. |
| 6 | `PROVIDER_ERROR` | External model/provider call failed. |
| 7 | `POLICY_VIOLATION` | Governance or risk policy blocks the action. |
| 8 | `HUMAN_LOCK_REQUIRED` | Judgment-class change requires Human Judgment Lock. |

## `kdna available --json`

Returns an array of installed domains. Required stable fields:

```json
[
  {
    "name": "@aikdna/writing",
    "version": "0.7.3",
    "description": "Writing judgment domain.",
    "quality_badge": "tested",
    "risk_level": "R0",
    "applies_when": ["reviewing drafts"],
    "does_not_apply_when": ["legal advice"]
  }
]
```

Consumers MUST key by `name`. Optional routing fields such as `applies_when`, `does_not_apply_when`, `keywords`, `trigger_signals`, and `installed_at` may be absent.

## `kdna load <name|file.kdna> --as=json`

Returns the loaded domain projection. Required stable fields:

```json
{
  "manifest": {
    "name": "@aikdna/writing",
    "version": "0.7.3",
    "spec_version": "1.0-rc",
    "quality_badge": "tested",
    "risk_level": "R0"
  },
  "core": {
    "meta": {
      "domain": "writing",
      "version": "0.7.3"
    },
    "axioms": []
  },
  "patterns": {
    "self_check": []
  }
}
```

The default prompt output is not a machine contract. Use `--as=json` for integrations.

## `kdna verify <name|file.kdna> --json`

The verify contract is layered. Implementations SHOULD expose structure, trust, and judgment results separately.

```json
{
  "ok": true,
  "target": "@aikdna/writing",
  "layers": [
    {
      "layer": "structure",
      "ok": true,
      "passed": ["has KDNA_Core.json"],
      "issues": []
    },
    {
      "layer": "trust",
      "ok": true,
      "passed": ["asset digest matches registry"],
      "issues": []
    },
    {
      "layer": "judgment",
      "ok": true,
      "passed": ["quality badge gate satisfied"],
      "issues": []
    }
  ],
  "warnings": []
}
```

Failure example:

```json
{
  "ok": false,
  "target": "./bad.kdna",
  "layers": [
    {
      "layer": "structure",
      "ok": false,
      "passed": [],
      "issues": [
        {
          "severity": "error",
          "msg": "kdna.json: kdna_spec is not allowed. Use spec_version."
        }
      ]
    }
  ],
  "warnings": []
}
```

## `kdna doctor --agents --json`

Returns agent integration health checks.

```json
{
  "healthy": true,
  "ok": 5,
  "failures": 0,
  "checks": [
    {
      "agent": "Codex",
      "skillInstalled": true,
      "detail": "kdna-loader installed (v2026.05)"
    }
  ]
}
```

Required stable fields: `checks`, and for each agent check, `agent`, `skillInstalled`, and `detail`.

## `kdna trace --json`

Returns recorded KDNA runtime events.

```json
{
  "count": 1,
  "entries": [
    {
      "timestamp": "2026-06-03T00:00:00.000Z",
      "event": "load",
      "domain": "@aikdna/writing",
      "version": "0.7.3"
    }
  ]
}
```

Required stable fields: `count`, `entries`. Trace entries MUST include `timestamp` and SHOULD include `event`, `domain`, and `version` when available.

## Snapshot Tests

The CLI repository MUST keep subprocess tests for:

- `kdna available --json` parses and includes v2.1 routing fields where available.
- `kdna load <domain> --as=json` parses and includes `manifest`, `core`, and `patterns`.
- `kdna doctor --agents --json` parses and includes agent skill status.
- `kdna trace --json` parses and includes `count` and `entries`.
- `kdna verify --json` parses on success and failure.

