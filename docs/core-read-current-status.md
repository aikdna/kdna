# Core and Read: current implementation status

Source status: 2026-10-09. Core `0.37.1-rc.browser.1` and Read
`0.11.2-rc.browser.1` are reference implementation candidates. Source readiness,
exact artifact acceptance and actual public publication are separate facts.
The [support matrix](current-release-support.md) and
[preview procedure](release-preview.md) define acquisition and compatibility.

## Exact SDK pair and contracts

Read declares Core `0.37.1-rc.browser.1` as its exact peer; both declare Node >=20.
Retain Core archive SHA256
`12a2d5f234ed3404aee1b394442251ad875c1531c01cd6a4f3c0366d55e5d773`
and Read archive SHA256
`c5c2d6b65c44dd30aeddd49d6f2a4c915e9fd4d8f2a28297d6d677564e261cb7`.
Every source/package member, installed graph and public channel has its own
identity. Matching version labels alone are insufficient.

The base browser/Node contract uses container `0.5.0`, Payload
`kdna.payload.judgment/0.5.1`, Core `kdna.core/0.8.2`, Canonical IR
`kdna.canonical-ir/0.6.1`, execution coordinates `0.3.1` and Read
`kdna.read/0.6.4`. The separate native-section subpaths use container `0.6.0`
and Read `kdna.read/0.7.0-candidate`. They do not reinterpret one container as the
other. Definitions remain in [public semantic source](../specs/public-semantic-source.json),
[version policy](../specs/public-version-policy.md) and
[generated manifest](../specs/public-generation-manifest.json).

Core admits immutable bytes and issues private snapshots. Read preserves the
authored question, answer or formation rule, mandatory references, scoped
boundaries and discovery/history bodies. It requires the embedding's trusted
control and Host observations. Unknown critical semantics reject; denied,
deferred and over-budget disclosures are not absence. Ordinary root/browser
admission retains protection refusals; the explicit retained browser route
accepts Host-unlocked bytes within its declared protection boundary. Core does
not decrypt in the browser. Explicit Node protection has its own
[provider contract](../specs/protection-admission.md).

Reference Plan/Capsule/Host/Trace APIs under their declared public subpaths do
not enable Plan/load in the native asset CLI. Serialized declarations and
receipts do not authenticate execution, humans or accounts. Current browser
engineering observations do not certify every engine, OS, WKWebView, Reader,
production identity service or native credential store.

## Matching consumer routes

| Consumer | Current candidate graph | Use and boundary |
| --- | --- | --- |
| Native CLI | CLI `0.39.0-rc.native-sections.3` with the exact SDK pair above | Container0.6 create/save/read/source-open/source-pack. Explicit permission, retained same-session handles; no Plan/load or protected-browser credential interface. |
| Loader/MCP | MCP `0.8.0-rc.native-sections.1` with that exact CLI and SDK pair | Complete Git source plus bundled graph; one operator-bound local file. npm publication disabled. Actual Host delivery/adoption remains unassessed. |
| Studio | StudioCLI `0.13.0-rc.components.2` / StudioCore `4.0.0-rc.components.2` with the same SDK pair | Container0.5/Read0.6.4 session, fresh role-specific adoption, revision, save/read/verify and explicit protected export. Use Studio's reader; nativeCLI does not read these assets. |

Use each consumer's own manifest, lock, full archive/member binding and
installation instructions. Older local combination/material-edit delivery
records retain their original bytes and scope; they no longer describe these
current source candidates. No current acquisition route depends on an unnamed
local archive or a version guessed from an earlier checkout.

The published history retains Core `0.37.0` / Read `0.11.1` and native CLI
`0.39.0-rc.native-sections.2` with Core `0.36.0-rc.r2.7` / Read
`0.11.0-rc.r2.7`. These are distinct installed graphs. The new preview coordinates
are available only once the official release/registry actually supplies them.
No page, clean checkout, package.json version or draft PR establishes that fact.

## Choose and obtain one matching delivery

Follow [exact preview preparation](release-preview.md) to export a clean,
DCO-signed Git source twice, pack with authenticated npm, verify every source
member and retain matching archives. Local candidate evidence cannot pass the
real-release event gate. Publication uses a separate npm preview dist-tag;
`latest` remains unchanged and existing version collisions fail closed.

For a complete ordinary native journey, use the licensed author input and
executable recipe in the [CLI source](https://github.com/aikdna/kdna-cli#readme).
It creates/saves, reads selections, revises through official Source, reopens and
reuses the revised file while preserving the original. For the supported
protected Studio/browser journey, use the
[Studio source and guide](https://github.com/aikdna/kdna-studio-cli#readme) with
its exact trusted Host and credential channel. The separate
[source-only local Host](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md)
handles protected container0.5 / Read0.6.4 consumption and saved-file revision;
StudioCLI's static read/verify does not unlock it, and native container0.6 is a
different route. A wrong credential, denied scope,
wrong snapshot, stale handle, inadequate budget or failed delivery must remain
an explicit failure; do not fall back to plaintext or a raw parser.

The package export and proof limits are maintained in the
[Core README](../packages/kdna-core/README.md) and
[Read README](../packages/kdna-read/README.md). JavaScript engine checks, Python,
Swift, native products, actual Agent use, editorial quality and human acceptance
have separate evidence. The [asset repository](https://github.com/aikdna/kdna-assets#readme)
keeps its own old-contract source/index and historical reference assets; those
records do not imply migration to this SDK pair.

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
