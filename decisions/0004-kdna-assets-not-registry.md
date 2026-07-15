# Decision 0004: kdna-assets Is a Release Repository, Not a Registry

**Date**: 2026-06  
**Status**: Accepted

## Context

When Core reached general availability without a registry, the question became: where do
example `.kdna` files and shared assets live? The `kdna-assets` repository was created, but
its role needed precise definition to prevent it from becoming an accidental registry.

## Decision

`kdna-assets` is a public release repository — a flat collection of `.kdna` files curated by
the KDNA maintainers. It is explicitly **not** a registry, marketplace, or store:

- No install protocol (no `kdna install` pointing at it)
- No ranking, popularity metrics, or curation algorithm
- No transactions, payments, or licensing enforcement
- No user-submitted assets — maintainers decide what goes in
- No versioning beyond what's in the git history

Users browse the repo, read the files, and copy them into their own projects. That's it.

## Rationale

A registry is a system. A repository is a folder. Conflating the two would create expectations
that `kdna-assets` cannot fulfill — search, dependency resolution, trust verification, update
notification. By defining it as a flat release repo, we make its scope unambiguous: it is a
source of examples and shared work, not a package manager.

This also prevents `kdna-assets` from becoming a backdoor registry. Without an install protocol,
the repo cannot be programmatically consumed as a distribution source. If someone builds a
registry later, `kdna-assets` could be one input to it — but the registry would need its own
protocol, its own trust model, and its own RFC.

## Consequences

- Users clone or browse `kdna-assets` manually. No CLI integration.
- No `kdna install` flag references `kdna-assets`.
- If a future RFC defines a registry, `kdna-assets` may serve as seed content — but the registry
  must define its own ingestion mechanism.
