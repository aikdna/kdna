# KDNA Authorization Conformance

Status: Draft, executable

This directory holds shared fixtures and golden LoadPlan outputs for KDNA
authorization behavior.

The goal is cross-implementation parity:

| Fixture | JS Core | Swift Core | CLI | Chat |
|---|---|---|---|---|
| `public-valid` | pass | pass | pass | planned |
| `password-missing` | pass | pass | pass | planned |
| `password-valid` | pass | pass | pass | planned |
| `receipt-missing` | pass | pass | pass | planned |
| `receipt-valid` | pass | pass | pass | planned |
| `expired-entitlement` | pass | pass | pass | planned |
| `revoked-entitlement` | pass | pass | pass | planned |
| `offline-grace-active` | pass | pass | pass | planned |
| `account-required` | pass | pass | pass | planned |
| `org-required` | pass | pass | pass | planned |
| `remote-recognized-not-loaded` | pass | pass | pass | planned |
| `tampered-payload` | pass | pass | pass | planned |
| `unknown-access` | pass | pass | pass | planned |
| `unknown-entitlement-profile` | pass | pass | pass | planned |

`unknown-access` and `unknown-entitlement-profile` are intentionally
Schema-invalid manifests whose expected LoadPlan state is `invalid`.

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

The generated cases are enforced by `tests/container-cli/container-authorization-conformance.test.js`.
