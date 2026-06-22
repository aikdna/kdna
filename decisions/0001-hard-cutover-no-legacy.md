# Decision 0001: Hard Cutover — No Legacy Surface

**Date**: 2026-06  
**Status**: Accepted  
**Driver**: 0.27.0 release

## Context

KDNA 0.x carried a legacy command surface (`kdna help legacy`) that predated the current schema and
tooling model. It used a different file format, a different validation pipeline, and a different mental
model for domain authoring. Maintaining both surfaces meant every schema change, every CLI flag, and
every error message had to be rationalized across two incompatible systems.

## Decision

We deleted the legacy command surface entirely in 0.27.0. There is no migration shim, no compatibility
bridge, and no `kdna help legacy` reference. Users who authored legacy `.kdna` files must re-author
them against the current schema and `kdna create` workflow.

## Rationale

A shim would have been worse than a clean break. The legacy schema differed structurally — not just
cosmetically — from the v1 schema. Any translation layer would have been lossy, would have introduced
ambiguous edge cases, and would have become a permanent maintenance tax. A hard cutover forces
one-time migration cost instead of indefinite dual-surface cost.

The removal also eliminates confusion for new users. A single `kdna create` path is the only path.
There is no "old way" to stumble into, no docs to bifurcate, no support questions about which
surface to use.

## Consequences

- Old `.kdna` files must be manually re-authored.
- No `legacy` string appears anywhere in the codebase, CLI, or docs.
- The `v1` prefix is implicit — everything is v1, so we don't label it.
