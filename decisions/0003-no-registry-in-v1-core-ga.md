# Decision 0003: No Registry in v1 Core GA

**Date**: 2026-06  
**Status**: Accepted

## Context

During v1 design, the question arose: should `kdna install` be part of v1 Core GA? A registry would
let users discover and install `.kdna` assets from a shared namespace, similar to package managers.
The alternative was to defer distribution entirely and ship only local operations.

## Decision

There is no registry in v1 Core GA. `kdna install` does not exist. All distribution — discovery,
versioning, installation, namespace resolution — is deferred to a future RFC. v1 Core GA does not
include any registry-related code, flags, or configuration.

## Rationale

A registry is a product, not a feature. It requires:

- A namespace and naming convention with conflict resolution
- A versioning scheme that interacts with the schema version
- Authentication and authorization for publishing
- A distribution protocol (HTTP API, content-addressed storage)
- A trust model (who can publish what, and how is that verified)

Each of these is a design problem that deserves its own RFC and its own stabilization period.
Bundling them into v1 Core GA would have forced premature decisions that would be expensive to
unwind. Worse, a half-built registry shipped in v1 would create user expectations that couldn't
be met — leading to bug reports, workarounds, and an accumulation of technical debt before the
feature even shipped properly.

The local-only scope of v1 Core GA (see Decision 0002) makes this decision natural. If the
product only commits to `create`/`validate`/`plan-load`/`load`, a registry has nothing to
distribute yet.

## Consequences

- No `kdna install`, no `kdna publish`, no registry namespace resolution.
- `kdna-assets` is a release repository, not a registry backend (see Decision 0004).
- A future RFC must address all the design problems listed above before registry code is written.
