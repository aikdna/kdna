# Asset Comparison Diagnostics

> **Status:** design note only. The current Runtime CLI does not expose a
> `kdna compare` command, and comparison is not a Preview release gate.

Comparing two loads can help diagnose whether a particular asset was carried
faithfully. It must not be presented as proof that KDNA makes a model smarter
or that a project-level improvement percentage exists.

## Appropriate diagnostic questions

For two legitimate but different assets, a bounded comparison may ask:

- Did both runs identify the exact asset and judgment version?
- Did each Runtime Capsule preserve the asset's declared scope, boundaries,
  and selected judgment?
- Did the resulting behavior differ in the direction the asset owner expected?
- Did out-of-scope tasks avoid inappropriate projection?
- Did current facts, user instructions, permissions, and safety policy retain
  precedence?

Prompt- or Skill-equivalent controls may be useful when investigating carrier
loss, but they are optional research diagnostics. They do not determine
whether the container, Core, Studio, or ecosystem integrations should exist or
be released.

## Minimum record

When a product team runs such a diagnostic, its record should state:

- exact asset identity and version;
- exact Runtime and Host coordinates;
- task and declared scope;
- projection profile and LoadPlan state;
- observed difference, including no difference;
- evaluator and limitations.

The record belongs to the tested asset or product context. Core does not assign
an intrinsic quality score, promotion badge, or superiority verdict.
