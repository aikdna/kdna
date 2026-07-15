# Runtime Trace Vocabulary

A **trace status** is a value that a loader emits to describe the outcome of a runtime operation. Trace statuses are facts about **runtime processing**, not about the asset's value. A status of `loaded` does not mean "this asset is good"; it means "this loader successfully read it".

## Status values

| Status | Meaning |
| --- | --- |
| `not_applicable` | The operation did not apply to this asset. For example, signature verification when the asset has no signatures. |
| `candidate` | The asset was identified as a candidate for an operation (e.g. matching) but no decision was made yet. |
| `requires_decryption` | The asset has encrypted entries that must be decrypted for the requested operation. The loader cannot proceed without a key. |
| `loaded` | The asset was read successfully. The payload bytes were interpreted, the schema validated, and the data is now available to the caller. |
| `skipped` | The loader intentionally chose not to read the asset. The reason is recorded in the trace metadata, not in the status value. |
| `blocked_by_runtime_policy` | The loader's policy rejected the asset. Policy reasons are external to KDNA Core; the status only reports the decision. |
| `failed_to_parse` | The container or its entries could not be parsed. The asset is malformed or the container is corrupted. |
| `failed_to_decrypt` | A required decryption failed. The key was provided but the operation did not succeed. |
| `signature_invalid` | A signature was present but did not verify against its declared payload and key. The asset MAY still be loaded, but the caller is responsible for deciding whether the signature matters. |
| `version_incompatible` | The asset's `compatibility.min_loader_version` is higher than the loader's version, or the manifest's `format_version` is not understood. |

## Status semantics

Trace statuses are **mutually exclusive at the operation level**. A single load operation produces exactly one status. Multiple operations on the same asset produce a status each.

Trace statuses are **not a quality grade**. A `loaded` status on a bad asset and a `loaded` status on a great asset are identical. The format supplies the mechanism, not the verdict.

## Trace metadata

A trace event SHOULD also record:

- `asset_uid` — which asset the status is about
- `profile` — which load profile was used (e.g. `compact`)
- `timestamp` — when the operation completed
- `loader_version` — the KDNA Core version of the loader

These fields are conventional; the format does not mandate a serialization. Loaders are free to log to stdout, structured logs, or a trace endpoint.

## Anti-patterns

- ❌ Using trace statuses to advertise assets (e.g. "we have 50,000 `loaded` assets"). The count is meaningless without the policy that produced it.
- ❌ Treating `signature_invalid` as a hard failure. KDNA Core supplies the signature so callers can decide; the format does not.
- ❌ Storing trace data inside the `.kdna` file. Trace is a runtime concept; it lives outside the format.
