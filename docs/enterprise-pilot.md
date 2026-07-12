# Team and Organization Pilot

Organizations are one KDNA use case, not the definition of KDNA. This guide
tests whether an explicit judgment asset survives model changes and improves a
specific, bounded decision context.

## Choose a Bounded Judgment

Select one recurring situation where experienced people make a meaningfully
different distinction from a generalist. Avoid organization-wide scope.

Examples include escalation judgment, design review standards, incident risk,
editorial taste, or deciding when a workflow must stop for human review.

## Create One Asset First

Use the public Studio toolchain to create a scoped asset. Human review and
Evidence are optional unless the organization wants to make a corresponding
claim.

```bash
npm install -g @aikdna/kdna-studio-cli @aikdna/kdna-cli
kdna-studio create ./pilot --name @example/pilot
kdna-studio export ./pilot --out ./pilot.kdna
kdna validate ./pilot.kdna
kdna plan-load ./pilot.kdna
kdna load ./pilot.kdna --profile=compact --as=prompt
```

Start with a single asset. Use a Cluster only when the task genuinely needs
multiple scoped judgment assets under explicit roles.

## Test the Judgment, Not the Vocabulary

Use real tasks and compare:

1. the same model without KDNA;
2. the same model with the asset;
3. a different model with the same asset;
4. non-applicable tasks, where the asset should skip, block, or ask.

Review the actual decision, boundary use, error type, and consistency. A model
repeating asset terminology is not proof of useful judgment transfer.

The optional evaluation path is:

```text
validate → plan-load → load/project → eval/replay → expert review
```

## Access and Deployment

- Use `public` when content secrecy is not required.
- Evaluate the release-specific `licensed` lifecycle before relying on local
  encrypted distribution.
- Treat remote and activation servers as self-hostable experimental reference
  implementations unless their release notes state otherwise.
- Do not depend on a private registry or AIKDNA-hosted service.

## Exit Criteria

A pilot is informative when it has a pinned asset, reproducible tasks, a
baseline, model-swap results, non-applicable cases, observed failures, and a
rollback path. It does not need to prove universal quality or become an
AIKDNA-published reference asset.
