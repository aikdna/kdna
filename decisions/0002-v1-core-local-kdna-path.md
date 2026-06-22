# Decision 0002: v1 Core GA Commits Only to Local .kdna Operations

**Date**: 2026-06  
**Status**: Accepted

## Context

The KDNA vision includes local authoring, validation, and loading as well as a broader ecosystem
of registry-based distribution, remote runtime execution, and cross-agent sharing. We needed to
define what ships in v1 Core GA and what is deferred.

## Decision

v1 Core GA commits only to the local `.kdna` lifecycle:

- `kdna create` — scaffold a new `.kdna` file
- `kdna validate` — validate schema and integrity
- `kdna plan-load` — dry-run load with diagnostics
- `kdna load` — load a `.kdna` file into the running session

Registry, remote runtime, and networked distribution are explicitly deferred to future RFCs.
No stubs, no placeholder flags, no `--registry` option shipped.

## Rationale

Shipping local-only first is a forcing function for quality. If `create`/`validate`/`plan-load`/`load`
are not rock-solid locally, adding network topology on top would multiply failure modes. By scoping
v1 Core GA to the filesystem, we can iterate on the schema and loading pipeline without worrying
about version skew across a registry, authentication, or network partitions.

This also keeps the CLI surface small and learnable. Four commands. No flags that imply future work.

## Consequences

- Users cannot `kdna install` or `kdna publish` in v1 Core GA.
- The `registry` subcommand does not exist.
- All distribution discussion is gated behind a future RFC.
