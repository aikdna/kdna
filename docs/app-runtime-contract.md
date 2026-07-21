# KDNA Application Runtime Contract

Applications consume one explicit file or exact user-approved attachment
through this responsibility chain:

```text
packaged asset
→ content-neutral LoadPlan
→ authorized Runtime Capsule
→ Agent Host request and receipt
→ JudgmentTrace
```

The schemas and executable vectors are in [`specs/`](../specs/) and
[`conformance/runtime-contract/`](../conformance/runtime-contract/).

## Validator scope

`npm run validate:runtime-contract` validates a committed
report + JudgmentTrace + feedback **execution-evidence triple**. It does not
treat JudgmentTrace as an independent routing trace.

- A `load` report must link to a Trace whose `overall_status` is
  `execution_completed`, `execution_failed`, `cancelled`, or `timed_out`, with
  selected Runtime negotiation and matched Host-boundary evidence.
- A `block` report must link to a Trace whose `overall_status` is `blocked`,
  with no selected or loaded domain in the report.
- An `ask` or `skip` report is a route-only report. It may be validated against
  the Judgment Report schema independently, must use a null `trace_id`, and is
  not a member of a JudgmentTrace + feedback execution-evidence triple.

## Application responsibilities

An application MUST:

- begin from an asset the user selected or an exact attachment the Host has
  already recorded as user-approved;
- request a LoadPlan before projecting judgment content;
- treat `public`, `licensed`, and `remote` as distinct authorization paths;
- deliver the exact Capsule whose digest is bound into the Host request;
- preserve the Host receipt without inventing provider, model, token, or
  semantic-consumption facts;
- emit a JudgmentTrace that distinguishes projection, delivery, execution,
  consumption evidence, and behavioral conformity;
- fail closed on digest, identity, version, capability, budget, or receipt
  mismatch.
- expose the active asset identity, version or digest, scope, and reason, with
  controls to disable, switch, and roll back it.

An application MUST NOT treat directory discovery, a cache entry, an installed
Skill, or a task-keyword match as user authorization.

An application MAY choose its own UI, model provider, storage, and workflow.
It may not redefine the shared protocol objects or turn optional author
provenance, review state, or quality evidence into Core format validity.

## Evidence boundary

Capsule delivery proves that verified judgment context crossed the Host
boundary. Host completion proves that the process returned. Neither proves that
a model understood, followed, or faithfully applied the judgment. Those claims
require separately observed evidence and evaluation.

See [SPEC.md](../SPEC.md) for the container and Runtime Capsule contract.
