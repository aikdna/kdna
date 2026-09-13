# Single source of truth for version and support facts

**Status:** current maintenance rule.

Version, support and capability facts are stated in one place each, and other
pages point at them instead of keeping a second copy. A duplicated table is
what goes stale first, so treat a copy as a defect rather than as redundancy.

| Fact | Single source |
|---|---|
| Format contract and every normative document | [`SPEC-INDEX.md`](../SPEC-INDEX.md), and [`SPEC.md`](../SPEC.md) |
| Published vs unpublished package coordinates | [`version-and-capability-matrix.md`](./version-and-capability-matrix.md) |
| Per-command CLI/Studio availability | [`tool-status-matrix.md`](./tool-status-matrix.md) |
| Current Core/Read implementation and support status | [`core-read-current-status.md`](./core-read-current-status.md) |
| Security support, reporting channel and response targets | [`SECURITY.md`](../SECURITY.md) |

Each page that states a version or support claim must also carry its applicable
version and status, so a reader arriving from a search result can tell whether
the page still applies.

## How a change propagates

1. Change the single source first. Nothing else is authoritative.
2. Update every page that points at it only if the pointer itself changed.
3. Do not paste the table into a second page to make it easier to read. If a
   page needs the fact, link to the source and state the applicable version.
4. When a fact is withdrawn, replace it in the single source and let the
   pointing pages stay silent, rather than leaving a stale copy behind.

## Why this is a separate page

`SPEC-INDEX.md` is one of the six accepted design inputs bound by exact bytes in
`specs/public-generation-manifest.json`, and `scripts/public-contract/generate.mjs
--check` fails with `DESIGN_DRIFT` when its bytes change. This rule therefore
lives here rather than inside that frozen index: adding a maintenance table to a
byte-bound design input would require a coordinated manifest rewrite, which is a
worse outcome than one extra small page.
