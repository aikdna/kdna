# KDNA Authorization Conformance

Status: Draft, executable

This directory holds shared fixtures and golden LoadPlan outputs for KDNA
authorization behavior.

The goal is cross-implementation parity:

| Fixture | JS Core | Swift Core | CLI | Chat |
|---|---|---|---|---|
| `public-valid` | pass | planned | pass | planned |
| `password-missing` | pass | planned | pass | planned |
| `password-valid` | pass | planned | pass | planned |
| `receipt-missing` | pass | planned | pass | planned |
| `receipt-valid` | pass | planned | pass | planned |
| `expired-entitlement` | pass | planned | pass | planned |
| `revoked-entitlement` | pass | planned | pass | planned |
| `offline-grace-active` | pass | planned | pass | planned |
| `account-required` | pass | planned | pass | planned |
| `org-required` | pass | planned | pass | planned |
| `remote-recognized-not-loaded` | pass | planned | pass | planned |
| `tampered-payload` | pass | planned | pass | planned |
| `unknown-access` | pass | planned | pass | planned |
| `unknown-entitlement-profile` | pass | planned | pass | planned |

## Directory Layout

```text
conformance/authorization/
├── cases.json
├── fixtures/
│   └── <case>/
│       ├── mimetype
│       ├── kdna.json
│       ├── payload.kdnab
│       └── checksums.json
└── goldens/
    └── <case>.loadplan.json
```

Fixtures are input source assets. Goldens are expected LoadPlan JSON outputs
that every conforming implementation should match.

`source.path` is normalized in every golden as `<fixture:name>` so the files are
stable across machines. Implementations should normalize their local path before
comparison.

Current executable schema source: `schema/load-plan.schema.json`.

## Updating Fixtures

Run:

```bash
npm run conformance:authorization:update
```

The generator derives each fixture from `examples/minimal`, applies the
authorization case metadata, rebuilds checksums, and writes the matching golden
LoadPlan.

The generated cases are enforced by `tests/cli-v1/v1-authorization-conformance.test.js`.
