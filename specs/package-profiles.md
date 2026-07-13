# KDNA Asset Access Profiles

This compatibility filename no longer defines container variants. Every KDNA
asset uses the same [KDNA Asset Container](./container.md). Access affects the
LoadPlan and authorized loading path, not the file format.

The canonical access values are defined in
[`kdna-access-modes.md`](./kdna-access-modes.md):

| Access | Meaning |
|---|---|
| `public` | Local Core may load after format and policy checks. |
| `licensed` | Core must validate the declared entitlement path before loading; encrypted judgment is decrypted in memory only. |
| `remote` | Local Core recognizes metadata, but a declared remote runtime returns task-scoped authorized projection. |

Historical values may be explicit migration inputs. Official writers MUST emit
only canonical values. No access mode makes KDNA Core a judge of content
quality or truth.
