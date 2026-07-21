# Host Applicability Policy

KDNA Core validates and projects a selected judgment asset. The Host owns the
policy for whether an already authorized attachment applies to a task.

## Candidate boundary

The Host may consider only:

- a `.kdna` file explicitly selected for the current task or session; or
- an exact project, app, or user attachment previously approved by the user.

It must not scan arbitrary files or a global store and turn discovery into
authority.

## Decision

For each candidate, return one of:

- `load` — clearly applicable and currently authorized;
- `ask` — scope or conflict is ambiguous;
- `skip` — not applicable;
- `block` — validation, authorization, integrity, revocation, or policy failed.

The decision reason, asset identity, exact version or digest, and attachment
scope must remain visible to the user. `load` still does not prove adoption or
external benefit.

## Precedence

System and developer rules, current law and safety requirements, current facts,
explicit user intent, and Host permissions take precedence over asset content.
Competing assets must not be silently blended; ask the user or skip.
