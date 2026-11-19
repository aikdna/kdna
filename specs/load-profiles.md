# KDNA Load Profiles

Status: **Compatibility pointer**

The historical `0.1.0` runtime projection profiles (`index`, `compact`,
`scenario`, and `full`) are documented in
[`kdna-runtime-projection.md`](./kdna-runtime-projection.md). Active Container
`0.6.0` selective reading uses [`read-contract.md`](./read-contract.md)
(`catalog` → `exact_selection` → `expand`).

This filename is retained for older links. It does not define a separate
Cluster allocator, automatic semantic routing system, risk-based profile
upgrade, cross-asset compression rule, or asset-declared minimum profile.

Important current boundaries:

- a profile is selected by an authorized caller or by a separately defined
  Host policy; the asset does not silently force more disclosure;
- `compact` preserves the declared judgment surface and reports omissions;
- `scenario` currently returns the declared scenarios array rather than
  guessing which scenario matches arbitrary task text;
- `full` is for audit/editing and is not the ordinary Agent prompt;
- multi-asset composition and token-budget allocation are separate,
  non-default responsibilities and are not created by this compatibility
  filename.
