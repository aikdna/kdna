# Coordinate families: protocol lines and consumer bindings

Source review: 2026-09-20. This is an implementation-status record, not a second
normative source or a consumer acceptance receipt.

[`public-semantic-source.json`](public-semantic-source.json) remains the single
machine semantics. Its current `versionTuple` and actual local Core/Read package
manifests identify **grammar.3**, **UNPUBLISHED_CANDIDATE**, with a
**REFERENCE_IMPLEMENTATION**. Acceptance remains
**SEPARATE_BYTE_BOUND_ACCEPTANCE**: final-byte freeze and independent acceptance
must be recorded separately. This page observes neither a registry nor an
installed downstream dependency graph.

## Current and historical identities

| Record | Container / payload | Core / IR / Read API | Core / Read package labels | Status and relationship to grammar.3 |
|---|---|---|---|---|
| Active 0.1 protocol | `0.1.0` / `0.1.0` | No corresponding new public API tuple is asserted for this line | Not package coordinates | Historical and still Active; unchanged; no grammar.3 fallback or rebinding |
| `authoring.4` | `0.2.0` / `0.2.0` | `0.4.0` / `0.3.0` / `0.3.0` | `0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4` | `SUPERSEDED_UNPUBLISHED_TARGET`; original record retained |
| `grammar.1` | `0.3.0` / `0.3.0` | `0.5.0` / `0.4.0` / `0.4.0` | `0.26.0-rc.grammar.1` / `0.5.0-rc.grammar.1` | `SUPERSEDED_UNPUBLISHED_TARGET`; original record retained |
| `grammar.2` | `0.4.0` / `0.3.0` | `0.6.0` / `0.4.0` / `0.4.0` | Proposed `0.27.0-rc.grammar.2` / `0.5.0-rc.grammar.2`; observed manifests still authoring.4 | `SUPERSEDED_UNPUBLISHED_TARGET`; original coordinate, proposal and actual-label evidence retained |
| **`grammar.3`** | **`0.5.0` / `0.4.0`** | **`0.7.0` / `0.5.0` / `0.5.0`** | **Actual `0.28.0-rc.grammar.3` / `0.6.0-rc.grammar.3`** | **Current unpublished reference implementation; independent acceptance separate** |
| Python consumer receipt | `0.2.0` / `0.2.0` | `0.3.0` / `0.2.0` / `0.2.0` | Accepted Core `0.24.0-rc.component-semantics.2` / Read `0.3.0-rc.component-semantics.2`; Python `aikdna 0.8.0rc2` | `LOCAL_RC_ONLY_UNPUBLISHED`; frozen old binding; no grammar.3 support established |

Protocol lines and consumer receipts are different records. Opening grammar.3
changes the current protocol candidate; it does not retarget a Python receipt,
rebind CLI/Studio/Reader, migrate assets or publish a package.

## Current grammar.3 source

| Axis | Value |
|---|---|
| container | `0.5.0` |
| payload_profile | `kdna.payload.judgment` |
| payload_version | `0.4.0` |
| core | `kdna.core/0.7.0` |
| ir | `kdna.canonical-ir/0.5.0` |
| runtime | `kdna.runtime-capsule/0.2.0` |
| plan | `kdna.consumption-plan/0.2.0` |
| host | `kdna.agent-host/0.2.0` |
| trace | `kdna.judgment-trace/0.2.0` |
| read | `kdna.read/0.5.0` |
| actual Core package | `0.28.0-rc.grammar.3` |
| actual Read package | `0.6.0-rc.grammar.3` |
| exact Read peer | `@aikdna/kdna-core@0.28.0-rc.grammar.3` |

Evidence is the machine source's `versionTuple`, `engineering.package_versions`
and `target_lines` record named `grammar.3`, plus the actual
[`Core package manifest`](../packages/kdna-core/package.json) and
[`Read package manifest`](../packages/kdna-read/package.json).
[`public-version-policy.md`](public-version-policy.md) gives the coordinate and
acceptance rules; [`public-generation-manifest.json`](public-generation-manifest.json)
binds the exact generated inputs and outputs. This page intentionally does not
freeze another duplicate current-source hash while implementation and independent
acceptance are being finalized.

Runtime Capsule, Consumption Plan, Agent Host request/receipt and Judgment Trace
now have complete native 0.2 formats, five generated schemas, and a reference
implementation in Core `/execution`. The
[execution contract](execution-contract-0.2.md) defines their source identity,
full-tuple binding, closure/digests, admission, budgets, Host observation boundaries
and wire-correlation validation. This is implemented scope, not schema-only or a
reservation to be borrowed from the historical 0.1 contract.

Reference implementation presence is separate from final-byte acceptance.
Configured provider observations are not production identity or permission
services; consistent wire receipts remain unauthenticated claims, and reference
output delivery is unconfirmed. Tests and previous receipts retain their exact
input, environment and proof limits. Downstream bindings need new exact receipts.

## Active 0.1 remains unchanged

The Active line continues to use container `format_version` `0.1.0` and payload
`compatibility.profile_version` `0.1.0`, as recorded in
[`SPEC.md`](../SPEC.md), [`SPEC-INDEX.md`](../SPEC-INDEX.md),
[`manifest.schema.json`](../schema/manifest.schema.json) and
[`payload-profile.schema.json`](../schema/payload-profile.schema.json).
Its existing lifecycle remains Active → Deprecated → Removed with a minimum
12-month deprecation window. Grammar.3 issues no deprecation notice and starts
no clock. A future notice must identify the old coordinate, scope, issuer, date
and earliest removal date under separate authority.

The grammar.3 admission path rejects unsupported old tuples without a legacy
decoder, conversion, dual read or fallback. Maintaining the Active 0.1 line and
opening an unpublished new implementation are distinct responsibilities; neither
promises that one runtime interprets both.

## Superseded unpublished records

The source's `target_lines` records named `authoring.4`, `grammar.1` and
`grammar.2` preserve their coordinates, package labels, accepted-design sizes and
hashes under `SUPERSEDED_UNPUBLISHED_TARGET`. Their supersession order is
`authoring.4` → `grammar.1` → `grammar.2` → `grammar.3`. Historical package names,
case-set names and evidence filenames are not current capability claims.

All three retained ten-field tuples declared Runtime Capsule, Consumption Plan,
Agent Host and Judgment Trace `0.2.0`. That historical coordinate declaration did
not itself supply complete execution formats or prove runtime support. The
complete current format/implementation and its acceptance scope are identified
above, without upgrading an older receipt.

The original **2026-09-19 grammar.2 observation** is retained verbatim as file
identity: `specs/public-semantic-source.json`, **296776 bytes**, SHA-256
`c5983caeaf3dc2872cd71114a18f7b497c4d62e6770769e1f5ee1d499e380fa6`.
At that observation it had three target rows: `authoring.4` at index 0,
`grammar.1` at index 1 and then-current `grammar.2` at index 2. Its source declared
schema-generation-only status. This is historical evidence, not the current
source hash or a claim that today's execution implementation is absent.

The earlier authoring.4 accepted-design record retains these original byte counts
and digest prefixes: `SPEC-INDEX.md` (5324 B, `06e92111ff2e…`),
`conformance/public-contract-decision-vectors.json` (183385 B, `ba5ce42bf565…`),
`specs/public-contract-decisions.json` (26894 B, `789cb05564b4…`),
`specs/public-source-map.json` (11770 B, `ca31b1d316b7…`),
`specs/public-version-policy.md` (8252 B, `930a8a6d6b4c…`) and
`specs/read-contract.md` (53070 B, `be15bddcebc3…`). The complete hashes remain in
that line's machine record. The 2026-09-13 input table is separately preserved in
[Core/Read status](../docs/core-read-current-status.md); none is normalized to
current bytes.

## Python's preserved consumer binding

Coordinates from its own generated contract: container `0.2.0`, payload version `0.2.0`, core
`kdna.core/0.3.0`, ir `kdna.canonical-ir/0.2.0`, read `kdna.read/0.2.0`.

Evidence:

- `python-sdk/kdna/core/_schemas/generated-contract.json:7397-7408` — `versionTuple`: core
  `kdna.core/0.3.0`, ir `kdna.canonical-ir/0.2.0`, read `kdna.read/0.2.0`, container and payload
  version `0.2.0`.
- `python-sdk/kdna/public-contract-binding.json:2` — format `kdna.consumer-exact-binding/1`.
- `python-sdk/kdna/public-contract-binding.json:7-18` — the exact bound tuple.
- `python-sdk/kdna/public-contract-binding.json:19-20` — the bound `semantic_source_sha256`
  (`9e6a4a2c…`) and `generated_contract_sha256` (`ec8a2616…`).
- `python-sdk/kdna/public-contract-binding.json:21-28` — `accepted_core` `0.24.0-rc.component-semantics.2`
  (tar SHA-256 `a9cb3f08…`) and `accepted_read` `0.3.0-rc.component-semantics.2` (tar SHA-256 `43d0f12a…`).
- `python-sdk/kdna/public-contract-binding.json:29` — `release_state = "LOCAL_RC_ONLY_UNPUBLISHED"`.
- `python-sdk/README.md:21` — "The public contract tuple is Core 0.3.0, Canonical IR 0.2.0 and Read 0.2.0."

These references describe the original Python binding and retain its recorded
coordinates and hashes; the line numbers belong to that observation. Its
acceptance names consumed tarballs and source/generated-contract digests, not a
future target. Retargeting version strings while retaining those hashes would
falsify the receipt.

Verdict: **Python remains frozen at its own exact binding; grammar.3 support is
not established.** Its Core `0.3.0` / IR `0.2.0` / Read `0.2.0` tuple predates
`authoring.4`. Neither this documentation update nor current Core/Read
implementation rebinds it. A new Python acceptance requires its own exact source,
artifacts, dependency graph and observed behavior after upstream independent
acceptance; the same rule applies separately to all other toolchain consumers.

## Proof boundaries

This page records current source identities and preserves history. It does not
modify protocol definitions, publish packages, authenticate execution claims,
accept an installed consumer, declare the protocol finally accepted or certify
asset/Reader content. The dated registry table in
[version and capability matrix](../docs/version-and-capability-matrix.md) remains
a separate 2026-09-13 observation.
