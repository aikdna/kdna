# Load a KDNA file into an AI Host

> Commands on this page use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

This guide demonstrates the published CLI 0.36.1 path: validate one explicitly
selected `.kdna` file, inspect the load decision, and hand the resulting
Runtime Capsule to a Host. It does not require a global asset library or an
Agent-installed Skill.

## Prerequisites

- Node.js 22 or later
- `npm install -g @aikdna/kdna-cli@0.36.1`
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

This published-line handoff uses the following steps in each Host. Actual
Host behavior must be verified independently:

1. the user selects a `.kdna` file, or approves an exact Host attachment;
2. the Host calls `plan-load` and then `load`;
3. the Host supplies only the toolchain-produced projection to the model;
4. the Host shows which asset is active and keeps user controls available.

The current `kdna-loader` adapter lives in
[`kdna-skills`](https://github.com/aikdna/kdna-skills#readme) and uses its exact
public Core/Read source graph. Native Host delivery and semantic adoption remain
unassessed; the older Capsule sequence above is not a fallback in that adapter.
Global discovery, broad task triggers, arbitrary asset selection and hidden use
do not establish permission or protocol conformance.

## What this proves

With corresponding Host evidence, this path can demonstrate validation,
authorization, projection and delivery for the selected file. CLI output alone
proves only that the projection was generated. It does not prove that its judgments are true, that the model
followed them, or that the result is better.

## Package-byte note

The logical entry identity is stable under the format contract, but exact ZIP
transport bytes depend on the pinned packer toolchain and its DEFLATE
implementation. Compare the declared entry-set and content identities for
logical equivalence; bind authorization or delivery to the exact immutable
package bytes actually selected.
