# KDNA Application Runtime Contract

Applications consume KDNA through one stable responsibility chain:

```text
packaged asset
→ content-neutral LoadPlan
→ authorized Runtime Capsule
→ Agent Host request and receipt
→ JudgmentTrace
```

The schemas and executable vectors are in [`specs/`](../specs/) and
[`conformance/runtime-contract/`](../conformance/runtime-contract/).

## Application responsibilities

An application MUST:

- request a LoadPlan before projecting judgment content;
- treat `public`, `licensed`, and `remote` as distinct authorization paths;
- deliver the exact Capsule whose digest is bound into the Host request;
- preserve the Host receipt without inventing provider, model, token, or
  semantic-consumption facts;
- emit a JudgmentTrace that distinguishes projection, delivery, execution,
  consumption evidence, and behavioral conformity;
- fail closed on digest, identity, version, capability, budget, or receipt
  mismatch.

An application MAY choose its own UI, model provider, storage, and workflow.
It may not redefine the shared protocol objects or turn optional author
provenance, review state, or quality evidence into Core format validity.

## Evidence boundary

Capsule delivery proves that verified judgment context crossed the Host
boundary. Host completion proves that the process returned. Neither proves that
a model understood, followed, or faithfully applied the judgment. Those claims
require separately observed evidence and evaluation.

See [SPEC.md](../SPEC.md) for the container and Runtime Capsule contract.
