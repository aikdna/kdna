# KDNA Consumption Runtime

The default consumption path begins with one explicit `.kdna` file or one exact
Host attachment that the user has already approved.

## Current source candidates: Core admission then Read

The current source candidates follow Core admission then Read. This
implementation has no LoadPlan or Runtime Capsule step:

```text
explicit file / approved attachment
→ Core admission
→ Read request admission under independently trusted Host providers
→ read_envelope | admission_rejection | no_body_control | transport_failure
→ Host delivery and visible active state
```

## Published CLI 0.36.1 line: LoadPlan then Runtime Capsule

The published loading line follows its own path:

```text
explicit file / approved attachment
→ inspect and validate
→ LoadPlan
→ authorization
→ Runtime Capsule
→ Host delivery and visible active state
```

Possession, saving, attachment, authorization, applicability, and loading are
separate events. Finding a file does not authorize it. Authorization does not
make it applicable to every task. Delivering a Runtime Capsule or a Read
envelope does not prove behavioral conformity or a better result.

## Host policy

Within its user-approved attachment set, a Host may evaluate declared scope and
return `load`, `ask`, `skip`, or `block`. It must not scan arbitrary files or a
global store, infer consent from task keywords, or silently blend competing
assets.

When an asset is active, the Host should expose its identity, version or digest,
scope, and selection reason, with controls to disable, switch, and roll back.

## Advanced published surfaces

Some published pre-release coordinates contain routing, composition, sidecar,
trace, review, and evaluation commands. They are advanced implementations under
product recertification, not prerequisites of the `.kdna` format and not the
default user flow. A sidecar can record a Host decision; it cannot endorse an
asset or grant it authority.

See [Runtime applicability policy](./runtime-routing.md),
[Application Runtime Contract](./app-runtime-contract.md), and the
[tool status matrix](./tool-status-matrix.md).
