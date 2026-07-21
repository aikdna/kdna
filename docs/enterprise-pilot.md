# Team and Organization Pilot

Organizations are one KDNA use case, not the definition of KDNA. This guide
checks whether an explicit judgment asset remains identifiable, authorized,
bounded, and inspectable when it is used across named Hosts and model changes.

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

## Review the Declared Judgment and Boundaries

Use real tasks and record:

1. which exact asset, version, digest, scope, and Host were authorized;
2. whether in-scope tasks express the owner's declared direction;
3. whether a different Host can consume the same explicit asset without
   silently changing its identity or critical projection;
4. whether non-applicable and conflicting tasks skip, ask, or defer as
   declared;
5. whether the user can see, disable, switch, and roll back the active asset.

Review the actual decision, boundary use, error type, and delivery evidence. A
model repeating asset terminology is not proof of faithful adoption. A caller
may run carrier comparisons for diagnosis, but they are not KDNA validity or
release gates.

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

A pilot is informative when it has a pinned asset, named owner and Host,
reproducible tasks, declared acceptance boundaries, non-applicable cases,
observed failures, visible delivery state, and a rollback path. It does not
prove universal quality, model-intelligence gain, or carrier superiority, and
it does not need to become an AIKDNA-published reference asset.
