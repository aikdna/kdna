# Load a KDNA file into an AI Host

This guide demonstrates the current portable path: validate one explicitly
selected `.kdna` file, inspect the load decision, and hand the resulting
Runtime Capsule to a Host. It does not require a global asset library or an
Agent-installed Skill.

## Prerequisites

- Node.js 18 or later
- `npm install -g @aikdna/kdna-cli`
- a `.kdna` file that the user selected for this task, session, app, or project

## Validate and plan

```bash
kdna validate ./my-judgment.kdna
kdna plan-load ./my-judgment.kdna --json
```

Do not continue unless the LoadPlan says the file can load now. A valid file is
not automatically authorized, applicable, adopted, or beneficial.

## Load a projection

```bash
kdna load ./my-judgment.kdna --profile=compact --as=json
```

For Hosts that accept only text:

```bash
kdna load ./my-judgment.kdna --profile=compact --as=prompt
```

The Host must keep the attachment visible: asset identity, exact version or
digest, scope, and why it was selected. The user must be able to disable,
switch, or roll back the attachment.

## Use in Codex, Claude Code, or OpenCode

The protocol path is the same in every Host:

1. the user selects a `.kdna` file, or approves an exact Host attachment;
2. the Host calls `plan-load` and then `load`;
3. the Host supplies only the toolchain-produced projection to the model;
4. the Host shows which asset is active and keeps user controls available.

The `kdna-loader` repository retains an Agent-adapter mission, but its current
Skill is **Unassessed**. Global discovery, broad task triggers, autonomous asset
selection, and hidden use are not the recommended integration path and are not
proof of protocol conformance.

## What this proves

This path can prove that a selected file was validated, authorized, projected,
and delivered. It does not prove that its judgments are true, that the model
followed them, or that the result is better.

## Package-byte note

The logical entry identity is stable under the format contract, but exact ZIP
transport bytes depend on the pinned packer toolchain and its DEFLATE
implementation. Compare the declared entry-set and content identities for
logical equivalence; bind authorization or delivery to the exact immutable
package bytes actually selected.
