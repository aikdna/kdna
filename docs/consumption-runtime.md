# KDNA Consumption Runtime

KDNA assets are portable judgment packages. A consumption runtime decides how
to use them for one task without changing the assets themselves.

```text
asset candidates → route → compose → project → agent context
                         ↓
                  trace → evaluate → review
```

## What each step does

- **Route** selects a primary judgment framework or abstains when no suitable
  framework is available.
- **Compose** adds only bounded advisor frameworks when they have a clear role.
  It does not fall back to loading every available asset.
- **Project** renders the selected asset into a task-safe context shape.
- **Trace** records the selection, budget, rejected candidates, and input
  provenance so a decision can be inspected later.
- **Evaluate** compares a policy across independent fixture sets and records
  quality, structure, and cost separately.

## Sidecars keep the file format stable

Route cards, consumer indexes, traces, and evidence manifests are optional
sidecars. They are versioned separately from `.kdna` files and may be replaced
without repacking an asset.

A generated sidecar is not an automatic runtime default. Consumers should
keep generated entries disabled until they have the required review and
evaluation evidence. A sidecar can describe a decision; it cannot turn an
asset into an endorsed or universally suitable asset.

## Budget profiles

The reference runtime offers three profiles:

| Profile | Intended use | Default approach |
| --- | --- | --- |
| `interactive` | Fast, user-facing work | One primary and a strict context budget. |
| `code-review` | Review and design discussion | A primary, bounded advisors, and a complete trace. |
| `offline-audit` | Evaluation and comparison | Explicitly configured budget; broad controls are allowed only for audit. |

Profile names are runtime policy, not protocol fields. Integrations may define
their own limits while preserving a trace of the chosen policy.

## Safety and review

Consumption metadata should be evaluated independently of an asset's file
validity. A valid asset can still be a poor match for a task. Reference tools
therefore support replay, review workbooks, and validation artifacts before a
candidate sidecar is applied.

See the [KDNA CLI consumption guide](https://github.com/aikdna/kdna-cli/blob/main/docs/consumption-runtime.md)
for commands and examples.
