# KDNA Read — public component revision

Unpublished release candidate for `kdna.read/0.2.0`. It has an exact peer on `@aikdna/kdna-core@0.24.0-rc.component-semantics.2` and consumes that Core's private snapshot and Canonical IR. It does not parse containers or recreate an IR.

| Entry | Value exports |
| --- | --- |
| root | `admitReadRequest`, `project` |
| `/node` | `readNode` |
| `/browser` | `readBrowser` |
| `/embedding` | `createTrustedReadControlProvider`, `createTrustedHostReadProvider` |
| `/transport` | `admitReadTransportResponse` |
| `/types` | Type declarations only |

Request admission validates the candidate and trusted control provider before Core or Host work. Pure `project` requires the private admitted request and Core snapshot. It reads no file, clock, Host or DOM, grants no permission and issues no handles.

The Host-facing adapters produce exactly four channels: `read_envelope`, `admission_rejection`, `no_body_control` or `transport_failure`, with the other fields explicitly null. Errors preserve the independently known semantic cause. Admission rejection uses only the trusted control limit. A valid request's UInt budget, including zero, applies to the complete final JCS Envelope. Both byte counts are fixed-width decimal strings; exact equality fits. Content is never truncated to fit.

The embedding factory wraps an independently trusted Host callback. Its observation binds request, snapshot, A/C, Host identity/epoch, current time, decision, scope and policy. Read checks that observation before disclosure and again when finalizing the result. A provider may also supply `deliver(result)`, returning true only on confirmed delivery; false or an exception produces a sanitized transport failure. Handles are committed only after delivery succeeds. Omitting `deliver` uses the successful in-process return as the delivery boundary.

`whole_asset`, `catalog`, `exact_selection` and `expand` consume Core-provided ordering and mandatory support. Host scope cannot remove a mandatory selected node. Catalog and omission records do not reveal unauthorized adjacent node identities. Asset-level risk and extensions remain typed declarations in the modes that disclose the necessary asset declaration; catalog can omit it.

Each Node call accepts a path or bytes through Core Node admission and therefore creates a new snapshot. New admission invalidates an old snapshot-bound handle. A custom trusted embedding that retains a snapshot can use pure projection under the same current Host gate; pure projection alone is never a disclosure endpoint. The internal reference pipeline tests this lifecycle without adding a production injection or mint API.

Browser Core admits stored and deflated bytes synchronously through the shared implementation. Browser Read also accepts a retained Core snapshot for expansion. Node execution of a browser entry is not proof of a browser engine; native browser acceptance, platform coverage and external identity/confirmation services are recorded separately.

The declarations and schema mirror come from the single public semantic source. The packages do not ship the conformance test issuer. See the component revision receipts for the exact test routes, source hashes, RC hashes and remaining external proof limits.

For an exact judgment selection, Read preserves the entire Core method value: native declaration, declared/undeclared field presence, original content and every supported interpretation body. It does not parse extension content or infer mechanisms from prose. An invalid explicit component prevents disclosure before Host evaluation. A valid empty collection stays supported and empty; an undeclared meaning stays null. Full-envelope budgeting includes all repeated raw and interpreted bytes, with no criteria truncation or partial semantics.
