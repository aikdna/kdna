# Core and Read: current implementation status

> Source status: 2026-09-23. Current line: **R2**, **UNPUBLISHED_CANDIDATE**.
> Implementation: **REFERENCE_IMPLEMENTATION**. Acceptance: **SEPARATE_BYTE_BOUND_ACCEPTANCE** — final-byte freeze and independent acceptance are separate, still-required records; this page does not issue them.
> Registry observations and older acceptance remain dated history, not evidence that a current candidate is published or that downstream consumers have rebound.

## Current source and coordinates

The actual local package manifests are
[`@aikdna/kdna-core@0.36.0-rc.r2.7`](../packages/kdna-core/package.json) and
[`@aikdna/kdna-read@0.11.0-rc.r2.7`](../packages/kdna-read/package.json).
Read declares the exact Core peer `0.36.0-rc.r2.7`; both declare Node >=20.
These are source identities. Exact archives, installed dependency graphs and
consumer behavior still require their own byte-bound evidence.

The complete tuple is container `0.5.0`, payload profile `kdna.payload.judgment`
version `0.5.1`, Core `kdna.core/0.8.2`, Canonical IR
`kdna.canonical-ir/0.6.1`, Runtime Capsule/Consumption Plan/Agent Host/Judgment
Trace `0.3.1`, and Read `kdna.read/0.6.4`. The authoritative definitions are
[`public-semantic-source.json`](../specs/public-semantic-source.json) and
[`public-version-policy.md`](../specs/public-version-policy.md), with the exact
generated closure in [`public-generation-manifest.json`](../specs/public-generation-manifest.json).
A source, specification, generated-output or dependency change invalidates
acceptance tied to its prior bytes; a version label alone cannot renew it.

## Choose and obtain one matching delivery

| Distribution | Identity and acquisition boundary |
| --- | --- |
| Published history | CLI `0.36.1` and Studio CLI `0.11.0` retain their pinned published-line examples. The recorded npm observation is dated 2026-09-13; it is not a claim about today's `latest`. Keep their assets and commands in that environment. |
| Remote `main` | A repository link is a source location, not a fixed delivery identity. Pin the source revision you receive and compare its manifests, lock, binding and archives with the intended row below. This page does not assert that remote `main` contains the local candidates. |
| Local unpublished candidates | Obtain a complete source delivery or the owning repository's coordinated local-consumer bundle, including its dependency archives and lock. If these exact inputs are unavailable, the candidate route is unavailable; do not fill gaps from `latest`, a global install or another graph. |

| Local entry (2026-09-23) | Package combination | Binding/install entry |
| --- | --- | --- |
| Core/Read source | Core `0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7` | The package manifests above; Node >=20; Read's exact Core peer must resolve to the same Core instance |
| Runtime CLI | CLI `0.40.0-rc.protection.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1` | [CLI README](https://github.com/aikdna/kdna-cli#readme), [binding](https://github.com/aikdna/kdna-cli/blob/main/public-contract-binding.json), [archive inventory](https://github.com/aikdna/kdna-cli/blob/main/release-surface/dependency-archives.json); Node >=22 |
| Loader/MCP | MCP `0.8.1-rc.combination.1` / CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1` | [MCP manifest](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/package.json), [complete local installation](https://github.com/aikdna/kdna-skills/blob/main/mcp-server/README.md), [canonical Loader](https://github.com/aikdna/kdna-skills/blob/main/kdna-loader/SKILL.md); Node >=22 |
| Studio creation and bounded source revision | Studio CLI `0.17.0-rc.material-edit.1` / Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1` | [Studio installation](https://github.com/aikdna/kdna-studio-cli#readme), [archive/member binding](https://github.com/aikdna/kdna-studio-cli/blob/main/src/public-bindings.json), [Creator](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/SKILL.md); Node >=22; use the complete source identity below and its installation conditions |

The current Studio route uses the local, unpublished complete source delivery
`kdna-studio-cli-source-e5496db2b7b4f600.tar.gz` (9,485,055 bytes), SHA256
`847779905b13a8d9cb3e713a72eb45ad026d5cfa49fa628d11fa17813372e93e`.
Its 137-member `SOURCE-INVENTORY.canonical.json` has SHA256
`e5496db2b7b4f600b0e0beaa83c13e01e3195190c4f9ab8ca0591f3cb96e2b9c`.
Obtain both from the delivery provider with the complete source, lock and
vendor archives, then follow the exact installation and Creator binding checks.
A standalone npm package archive lacks these complete-source prerequisites.
This local source update does not update official remote source or npm releases;
repository links and historical published examples do not supply these bytes.
Source placement is not an activated global install or a native Host support claim.

The runtime CLI and MCP graphs bind Core archive SHA256
`4af865591fc413cee2a9c5193a2f8f7d8f4305e07782d34b1b5817f0ed21faad` and Read archive SHA256
`23c198ee259373775775752d658f4a396ae869db7055c0ef0cc5fe93364f2766`.
MCP additionally binds CLI archive SHA256
`f9f76c677a90f856e3c60daaa54db1c33bc6fc77bb99c46a51a584278d7c6adf`.
Use the full owning inventory for every dependency and package member; these
three hashes alone are not an installation recipe. Matching protocol tuples
do not make these package graphs interchangeable or prove a complete journey.
Install in a separate directory with its own cache and invoke the explicit
local executable. Do not overwrite a working older installation.

The canonical Loader uses the MCP/CLI 0.39.1 graph. For direct CLI 0.40 use its
own README and binding. Static `plan` and `load --plan` supply a Plan/Capsule;
they do not run a model or grant action permission. MCP offers Read tools only.
Codex/OpenCode native activation, semantic adoption and real human acceptance
remain `not_run` in the [support matrix](https://github.com/aikdna/kdna-skills/blob/main/docs/agent-support-matrix.json).

## What is implemented

Core admits an immutable container, validates its Manifest and typed Payload,
resolves the static graph, computes A/C/E and Canonical IR digests, and issues a
private snapshot. Read consumes the admitted snapshot through its public request,
projection, Host embedding and transport surfaces. Unknown critical semantics
reject all four modes. R2 preserves full authored questions, typed answers and
formation rules, required references, asset discovery and scoped history bodies.
The historical catalog-only critical fallback is not active in this tuple.

All four native execution coordinates now have complete public formats: Runtime
Capsule, Consumption Plan, Agent Host request/receipt and Judgment Trace. The five
generated schemas and [`execution-contract-0.3.md`](../specs/execution-contract-0.3.md)
define their closed fields, source/selection/digest bindings, budgets and
non-schema obligations. The Core `/execution` reference implementation supplies
builders, admission, inspectors, correlation validators and an explicitly
configured Host. It does not reuse historical 0.1 formats under new labels.

Static admission does not evaluate conditions or authorize actions. The execution
Host relies on configured external observation providers; valid serialized
receipts are claims, not authenticated execution evidence. Output delivery remains
unconfirmed by the reference protocol. Production identity, durable authorization,
external verification services and actual downstream Host integration remain
separate responsibilities. Ordinary root/browser admission retains encryption,
signature and checksums-document refusal. Explicit Node protection is a separate
[contract and provider boundary](../specs/protection-admission.md); its presence
does not enable implicit secret handling or prove native/account integration.

The exact exports, limits and boundary statements are maintained in
[`packages/kdna-core/README.md`](../packages/kdna-core/README.md) and
[`packages/kdna-read/README.md`](../packages/kdna-read/README.md). Source presence
and self-tests do not substitute for final-byte independent acceptance.

## Quickstart (candidate, exact local source only)

No R2 registry release is established by this page. After obtaining the
complete Core/Read delivery described above, install its exact candidate archive
and exact peer and retain the installed graph with its acceptance evidence. The following uses the static admission surface:

```js
import { admitNode } from '@aikdna/kdna-core/node';
import { inspectSnapshot } from '@aikdna/kdna-core/read-boundary';

const result = await admitNode('/absolute/path/example.kdna');
if (result.status === 'accepted') {
  const view = inspectSnapshot(result.snapshot);
  console.log(view.asset, view.ir.catalog);
} else {
  console.log(result.reason, result.diagnostics);
}
```

Read an admitted snapshot through the public Read surface rather than by
unpacking or decoding the container. Unpacking or directly decoding asset
internals is not a compatible consumption path, and it is not evidence about
Read.

## Evidence and downstream boundaries

Node execution of a `/browser` export is not browser-engine evidence. Each real
browser, engine, OS, native shell and WKWebView needs its own observation; none is
inherited from earlier Core/Read candidates. Python, Swift, CLI, Studio, assets
and Reader keep their existing bindings until separately rebuilt and accepted
against this line. This page makes no toolchain, asset, Reader, human-adoption,
content-quality or publication acceptance claim.

The two preserved historical reference assets and the older
`@aikdna/verification-scope@0.1.5` candidate retain their original records in the
[asset repository](https://github.com/aikdna/kdna-assets#readme). Their earlier
observations do not establish R2 acceptance or migration.

## Preserved history

`authoring.4`, `grammar.1` and `grammar.2` are
`SUPERSEDED_UNPUBLISHED_TARGET` records under their own `target_lines` rows.
Their coordinates, package labels and accepted-design hashes retain their
historical meaning; R2 does not retarget those receipts or create a
fallback. Grammar.2's proposed Core/Read labels were `0.27.0-rc.grammar.2` /
`0.5.0-rc.grammar.2`, while its observed manifests still bore
`0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4`. That mismatch is a historical
observation, not the current package state. Active 0.1 remains in force at its
own coordinates, without a deprecation notice or removal clock from this change.

The following table preserves the exact **2026-09-13** design-input observation.
It is not the current generated manifest or an R2 acceptance receipt.

| Frozen input (2026-09-13) | Bytes | SHA-256 |
|---|---:|---|
| `SPEC-INDEX.md` | 4870 | `34d6a900d065ff4239dd6c8359cbdb9c7b0ee56caa91713e6761c41997515091` |
| `specs/read-contract.md` | 52305 | `5a7de907855d52ee143a0c969c16a803aefb97062c56010c99546a135ef84dc4` |
| `specs/public-version-policy.md` | 7459 | `3f144259b3ef8eef60728c75a8533147f40ccca556710257ad139bf7d6072418` |
| `specs/public-contract-decisions.json` | 26818 | `7ebbfff1588872659482d41e067b3033d54e7a1b0873c051ec36b64733b4893c` |
| `specs/public-source-map.json` | 11770 | `ca31b1d316b74d4384c5843e3fa245dc1bba87d3be9e4922a0d4ff754e102cbf` |
| `conformance/public-contract-decision-vectors.json` | 183385 | `5c22f92527fd93c85c04a1d28d3790455ea5cd06c0df94c56f8fd7446be9e843` |

The 2026-09-13 implementation observation concerned Core
`0.24.0-rc.component-semantics.2` and Read `0.3.0-rc.component-semantics.2`.
It recorded static admission and projection, with Capsule/Plan admission and
execution unavailable in those candidates. Historical `NOT_IMPLEMENTED` or
`NOT_RUN` wording retains that date and scope; it does not describe the current
native 0.3.1 reference implementation or become a retrospective pass.

Private dispatch notes and receipt identifiers remain internal evidence. The
public source identities, contracts and proof limits are available from this
repository. See the [version and capability matrix](./version-and-capability-matrix.md)
for separately dated registry and consumer records.
