# KDNA Version and Capability Matrix

> Last verified: 2026-09-13.
>
> This page keeps two coordinate families apart: the **currently published**
> npm line and the **unpublished local release candidates**. Package versions,
> protocol versions and API coordinates answer different questions, and sharing
> a number does not equate their meanings. Nothing here merges them into one
> marketing version, and a row is only as strong as the observation recorded
> for it.

## Why one matrix needs separate columns

The published packages implement the Active design recorded in
[`SPEC-INDEX.md`](../SPEC-INDEX.md). The unpublished candidates implement a
different, explicitly non-Active design recorded in
[`specs/public-version-policy.md`](../specs/public-version-policy.md) and the
`UNPUBLISHED_DESIGN_TARGET` appendix of the same index. Those documents issue
no deprecation notice and start no removal clock.

Consequences a reader should apply before installing anything:

- A published version number does not describe a candidate, and a candidate
  number does not describe a published artifact.
- "One component accepts a new tuple" is not evidence that another component,
  language or Host does.
- A local source tree is not registry evidence; no `latest` or `published`
  claim follows from a working copy.

## How a change propagates

Each fact has one owning page, and the other pages point at it instead of
keeping a second copy. When something changes:

| The change | Update here | Then |
|---|---|---|
| A package is published or unpublished | Section 1 or 2 of this page, and `release-health-policy.json` | Re-read the registry in the same change; do not copy a version from a README |
| A protocol, container, IR or API coordinate moves | Section 3 of this page | Update the Active index or the version policy first; a coordinate claim with no owning document is a defect |
| A component accepts or drops a capability | That component's own README | Then this page's reception table, and `docs/component-reception-status.md` |
| A command is added, withdrawn or renamed in a published package | `docs/tool-status-matrix.md` | Do not restate the command list here |
| Asset acceptance changes | `aikdna/kdna-assets` index and README | Then section 4 of this page |

A change that alters a byte-bound design input must be re-pinned in
`specs/public-generation-manifest.json` in the same change; the generator
refuses to run while the two disagree.

## 1. Published npm coordinates

Observed 2026-09-13 with `npm view <package> version`. This is a registry
metadata read, not an artifact-byte identity, and it is not a compatibility
promise.

| Package | Published version | Public role |
|---|---:|---|
| `@aikdna/kdna-core` | `0.22.0` | Reference Core runtime |
| `@aikdna/kdna-cli` | `0.36.1` | Terminal toolchain |
| `@aikdna/kdna` | `0.14.0` | Legacy compatibility bridge |
| `@aikdna/kdna-eval` | `0.3.2` | Issuer-scoped evaluation toolkit |
| `@aikdna/kdna-conformance` | `0.2.0` | Conformance fixtures and verdicts |
| `@aikdna/kdna-studio-core` | `3.0.0` | Published Studio creation engine |
| `@aikdna/kdna-studio-cli` | `0.11.0` | Published Studio terminal Host |
| `@aikdna/kdna-web-server` | `0.3.1` | Published server-side adapter layer |
| `@aikdna/kdna-web-client` | `0.3.0` | Published browser client |
| `@aikdna/kdna-react` | `0.4.0` | Published React bindings |
| `@aikdna/kdna-mcp-server` | `0.5.0` | Published MCP adapter |
| `@aikdna/kdna-remote-server` | `0.4.2` | Reference remote access server |
| `@aikdna/kdna-activation-server` | `0.2.1` | Reference activation server |
| `create-kdna-web-app` | `0.5.0` | Project scaffold |

The repository's own declaration of this table's package set and published
values is [`release-health-policy.json`](../release-health-policy.json); it
lists 14 packages. That file is maintained by the release-health gate, so it can
lag a registry observation by one release; treat the two as separate
observations and re-read both before quoting either.

These coordinates are **not published at all** (registry returns 404):
`@aikdna/kdna-read`, `@aikdna/kdna-assets`, `@aikdna/kdna-app-shared`.
A reader must not assume a package exists because a repository, a README or a
working copy exists.

## 2. Unpublished local release candidates

Values below are the `version` fields of the source working tree. Every row is
**unpublished**: no registry tag, no tarball and no download URL is claimed.

| Package | Local candidate version | Publication state |
|---|---:|---|
| `@aikdna/kdna-core` | `0.24.0-rc.component-semantics.2` | Unpublished candidate |
| `@aikdna/kdna-read` | `0.3.0-rc.component-semantics.2` | Unpublished candidate |
| `@aikdna/kdna-cli` | `0.38.0-rc.component-semantics.1` | Unpublished candidate |
| `@aikdna/kdna-studio-core` | `4.0.0-rc.components.1` | Unpublished candidate (`private`) |
| `@aikdna/kdna-studio-cli` | `0.13.0-rc.components.1` | Unpublished candidate |
| `@aikdna/kdna-web-server` | `0.5.0-rc.component-semantics.1` | Unpublished candidate |
| `@aikdna/kdna-web-client` | `0.5.0-rc.component-semantics.1` | Unpublished candidate |
| `@aikdna/kdna-react` | `0.6.0-rc.component-semantics.1` | Unpublished candidate |
| `@aikdna/kdna-mcp-server` | `0.7.0-rc.component-semantics.1` | Unpublished candidate (`private`) |
| `@aikdna/kdna-assets` | `0.3.0-rc.component-semantics.1` | Unpublished source bundle (`private`) |
| `@aikdna/kdna-remote-server` | `0.6.0-rc.component-semantics.1` | Unpublished candidate |
| `@aikdna/kdna-activation-server` | `0.4.0-rc.component-semantics.1` | Unpublished candidate |
| `kdna-vscode` | `0.3.0` | Unpublished local candidate |

Two candidates declare `private: true`, so publishing one requires a
deliberate coordinate change in the same release, not a version bump alone.
The component definition referenced across the candidate graph is
`sha256:3087cd19542e72322aec19b3015c916d2cfb074fa42e3fd76b3756bb4f097de3`.

## 3. Protocol, container, IR and API axes

Left column: the design marked Active in `SPEC-INDEX.md` and carried by the
published packages. Right column: the unpublished target recorded in
`specs/public-version-policy.md`. `UNKNOWN` means this page did not verify a
value and will not guess one.

| Axis | Active published design | Unpublished design target |
|---|---|---|
| Container `format_version` | `0.1.0` | `0.2.0` |
| Payload profile version | `0.1.0` | `0.2.0` (`kdna.payload.judgment`) |
| Core public API | UNKNOWN (per-package, not restated here) | `kdna.core/0.3.0` |
| Canonical IR | UNKNOWN (per-package, not restated here) | `kdna.canonical-ir/0.2.0` |
| Runtime Capsule `contract_version` | `0.1.0` | `kdna.runtime-capsule/0.2.0` |
| Consumption Plan `contract_version` | `0.1.0` | `kdna.consumption-plan/0.2.0` |
| Agent Host exchange | `kdna.agent-host` `protocol_version` `0.1.0` | `kdna.agent-host/0.2.0` |
| Judgment Trace `contract_version` | `0.1.0` | `kdna.judgment-trace/0.2.0` |
| Digest evidence `profile_version` | `0.1.0` | `0.2.0` for the A/C/E/P domains |
| Read API | UNKNOWN (no published `kdna-read` package exists) | `kdna.read/0.2.0` |

The target column is `UNPUBLISHED_DESIGN_TARGET / NOT_IMPLEMENTED` under its own
status line. It is a reviewable design decision set, not an installed behavior,
and it does not reinterpret the Active coordinates above.

## 4. Supported reference assets

The two public reference assets in `aikdna/kdna-assets`
(`@aikdna/laozi-wuwei` and `@aikdna/epictetus-control-and-character`, both
`0.1.1`) **retain their original bytes and licenses and are rejected with
`READ_CORE_INVALID` by the current candidate graph** (`checked_at`
2026-09-10, method `public_node_adapter`, recorded in that repository's schema-2
index). Their historical acceptance belongs to the older toolchain recorded with
them; it is not current compatibility.

This matrix therefore makes no "the new line reads the old assets" claim. The
candidate implements no legacy decoder, no conversion and no dual read; a
complete old or unrelated tuple yields an explicit unsupported-version
rejection. A future sample set must be created and accepted as its own bytes
rather than by rewriting the registered reference assets.

Which assets the **published** line accepts is not restated here (UNKNOWN);
verify it against the exact published artifact rather than against this page.

## 5. Verified environments

Only the environments below are recorded as exercised. A missing platform is
unverified, not failing, and not inherited from a neighboring component.

| Component | Environment actually exercised | Source of the statement |
|---|---|---|
| Core / Read candidates | Node.js on the development host; browser entry exercised separately from Node | package READMEs in `packages/kdna-core`, `packages/kdna-read` |
| Assets adapter | macOS arm64, Node.js 26.5.0 | `aikdna/kdna-assets` README |
| Web Host / Web Client / React | Node.js 22 or newer; React 18.3.1 for the React candidate (declared peer range `>=18 <20`) | Web Host, Web Client and React READMEs |
| Demo viewer | Next 16.3.5, React 19.2.7, Playwright WebKit 1.61.1, loopback only | `aikdna/kdna-demo-web-viewer` README |
| VS Code extension | VS Code 1.130.0 or newer, trusted workspace, unpublished local candidate | `aikdna/kdna-vscode` README |
| Swift Core/Read | installed macOS arm64 toolchain only | `aikdna/kdna-core-swift` README |

Node execution of a browser entry is not browser-engine evidence, and a
successful local build is not a platform-coverage claim.

## 6. Not supported, and the alternative path

| Not supported in the candidate line | Alternative path |
|---|---|
| Installing any candidate from the registry | Build from the exact local source candidate; every candidate is unpublished |
| Reading an old or unrelated version tuple | None. Rejection is terminal; re-create the asset under the current design |
| ZIP64, data descriptors, unsupported codecs, CBOR tags/indefinite forms, bytestring payloads | Fail closed by design; repackage the input in the supported bounded ZIP32/CBOR subset |
| Encryption, signature and checksums-document admission | Authorized separately; no metadata claim is treated as cryptographic verification |
| Runtime Capsule / Consumption Plan admission, durable Host policy, external verification services | Separately owned responsibilities with their own evidence |
| Cross-language parity (Swift, Python, other native shells) | Per-language candidates report their own verified environments |
| Transparent upgrade of the published line | None is promised. Maintaining the Active line and publishing a separate new implementation are distinct responsibilities |

For the currently installable path, use the published line: the Active design
in `SPEC-INDEX.md` with the published CLI coordinate, as described in
[`docs/status.md`](./status.md).

## 7. Per-component reception status

| Surface | Reception status |
|---|---|
| Core / Read candidates | Implemented locally, unpublished; see [`docs/core-read-current-status.md`](./core-read-current-status.md) |
| CLI, Studio, Web Host, Web Client, React, MCP, VS Code, Swift | Each reports its own accepted and not-yet-accepted surface; see the reception status page inside each repository and [Component reception status](./component-reception-status.md) |

## Related documents

- [`SPEC-INDEX.md`](../SPEC-INDEX.md) - the Active normative index.
- [`specs/public-version-policy.md`](../specs/public-version-policy.md) - the
  unpublished target tuple and its acceptance rules.
- [`docs/core-read-current-status.md`](./core-read-current-status.md) - dated
  implementation status and Quickstart for Core/Read.
- [`docs/product-map.md`](./product-map.md) - which entry is for whom.
- [`docs/tool-status-matrix.md`](./tool-status-matrix.md) - the single source for
  per-command CLI and Studio availability; it carries its own date and version.
