# KDNA Version and Capability Matrix

> Core/Read, CLI, Studio and MCP local source bindings reviewed: 2026-09-23.
> Other component source observations remain dated 2026-09-14;
> registry observations remain dated 2026-09-13. This
> update is neither a new registry check nor downstream consumer acceptance.
>
> The current Core/Read line is **R2**, **UNPUBLISHED_CANDIDATE**, with a
> **REFERENCE_IMPLEMENTATION**. Final acceptance is **SEPARATE_BYTE_BOUND_ACCEPTANCE**:
> it must bind the final source, generated closure and actual artifacts independently.
> Package versions, wire versions and API coordinates remain separate axes.

## Why one matrix needs separate columns

The dated published-package observations below refer to the Active design recorded in
[`historical SPEC-INDEX.md`](../specs/history/pre-r2/SPEC-INDEX.md). The unpublished candidates implement a
different, explicitly unpublished line recorded in
[`specs/public-version-policy.md`](../specs/public-version-policy.md) and the
current [specification index](../SPEC-INDEX.md). Those documents issue
no deprecation notice and start no removal clock.

Consequences a reader should apply before installing anything:

- A published version number does not describe a candidate, and a candidate
  number does not describe a published artifact.
- "One component accepts a new tuple" is not evidence that another component,
  language or Host does.
- Public Git source and a local source tree are not registry evidence; no
  registry `latest` or package-release claim follows from either.

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

## 1. Published npm coordinates observed 2026-09-13

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

At that 2026-09-13 observation, the following coordinates returned registry 404:
`@aikdna/kdna-read`, `@aikdna/kdna-assets`, `@aikdna/kdna-app-shared`.
A reader must not assume a package exists because a repository, a README or a
working copy exists.

## 2. Current Core/Read source and preserved component observations

The current package labels below are read from the actual local manifests; Read
uses the exact Core peer shown. No publication, installed acceptance or downstream
rebinding follows from those labels.

| Current local package (2026-09-23) | Actual source version | Bound graph and state |
|---|---|---|
| `@aikdna/kdna-core` | `0.36.0` | Unpublished reference implementation; Node >=20; separate byte-bound acceptance |
| `@aikdna/kdna-read` | `0.11.0` | Exact Core `0.36.0` peer; Node >=20 |
| `@aikdna/kdna-cli` | `0.40.0-rc.protection.1` | Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |
| `@aikdna/kdna-studio-core` | `4.5.0-rc.material-edit.1` | Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |
| `@aikdna/kdna-studio-cli` | `0.17.0-rc.material-edit.1` | Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`; local unpublished source; Node >=22 |
| `@aikdna/kdna-mcp-server` | `0.8.1-rc.combination.1` | CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`; private candidate; Node >=22 |

The [source/delivery guide](./core-read-current-status.md#choose-and-obtain-one-matching-delivery)
links each exact manifest, binding, archive inventory and installation entry.
These combinations are not interchangeable. Obtain the complete matching source
delivery and lock/archives; neither remote `main` nor npm `latest` is identified
by a local working-tree observation. CLI 0.40 is not the MCP adapter's CLI 0.39.1
graph. Protocol equality alone is not interoperability or acceptance evidence.
Current source-only documentation changes do not rewrite already fixed package
archives or renew their acceptance.
The current Studio complete source delivery and its 137-member identity are
listed in that source/delivery guide. This local update does not update official
remote source or npm releases, activate a global install, or broaden any native
Host acceptance dimension.

The following table is preserved **2026-09-14 source-review history**, including
older CLI/Studio/MCP rows superseded by the local observations above. It is not a
second current installation matrix. Other components have not been rechecked
by this documentation update; each component's own receipt determines its
supported tuple.

| Package | Source candidate version | Publication state |
|---|---:|---|
| `@aikdna/kdna-cli` | `0.38.0-rc.component-semantics.1` | Unpublished candidate (`private`) |
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


Rows marked `private` describe package metadata, not repository visibility.
A version bump does not publish or accept a component. Companion entry points
remain indexed in [Component reception status](./component-reception-status.md).
The component-definition hash recorded with that historical graph was
`sha256:3087cd19542e72322aec19b3015c916d2cfb074fa42e3fd76b3756bb4f097de3`;
it is not an independent receipt for the current package graph.

The earlier Core `0.24.0-rc.component-semantics.2` and Read
`0.3.0-rc.component-semantics.2` rows are preserved here as historical source
observations. Grammar.2 later proposed Core `0.27.0-rc.grammar.2` / Read
`0.5.0-rc.grammar.2`, with actual manifests still labeled
`0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4`. That mismatch belongs to the
superseded grammar.2 record; the current R2 manifests match their declared
package labels.

## 3. Protocol, container, IR and API axes

The left column preserves the Active 0.1 design. The right column identifies the
current unpublished R2 source defined by
[`public-version-policy.md`](../specs/public-version-policy.md). `UNKNOWN`
means this page does not restate a verified value.

| Axis | Active published design (historical, still effective) | Current unpublished source (`R2`) |
|---|---|---|
| Container `format_version` | `0.1.0` | `0.5.0` |
| Payload profile version | `0.1.0` | `0.5.1` (`kdna.payload.judgment`) |
| Core public API | UNKNOWN (per-package, not restated here) | `kdna.core/0.8.2` |
| Canonical IR | UNKNOWN (per-package, not restated here) | `kdna.canonical-ir/0.6.1` |
| Runtime Capsule `contract_version` | `0.1.0` | `kdna.runtime-capsule/0.3.1` |
| Consumption Plan `contract_version` | `0.1.0` | `kdna.consumption-plan/0.3.1` |
| Agent Host exchange | `kdna.agent-host` `protocol_version` `0.1.0` | `kdna.agent-host/0.3.1` |
| Judgment Trace `contract_version` | `0.1.0` | `kdna.judgment-trace/0.3.1` |
| Digest evidence `profile_version` | `0.1.0` | `0.2.0` for the A/C/E/P domains |
| Read API | UNKNOWN (no published Read package at the 2026-09-13 registry observation) | `kdna.read/0.6.4` |

Current state is `UNPUBLISHED_CANDIDATE` with `REFERENCE_IMPLEMENTATION`.
The four execution coordinates have complete formats in the
[execution contract](../specs/execution-contract-0.3.md), five generated schemas
(Host has request and receipt), and the Core `/execution` reference surface.
Their implementation is no longer merely reserved or schema-generation-only.
Independent acceptance must bind the final bytes; this table does not certify
actual provider behavior, authenticated receipt claims or output delivery.
The Active 0.1 column is unchanged, with no new deprecation notice or clock.

Superseded unpublished lines remain separate `target_lines` history:

| Historical line | Container / payload | Core / IR / Read API | Proposed Core / Read packages |
|---|---|---|---|
| `authoring.4` | `0.2.0` / `0.2.0` | `0.4.0` / `0.3.0` / `0.3.0` | `0.25.0-rc.authoring.4` / `0.4.0-rc.authoring.4` |
| `grammar.1` | `0.3.0` / `0.3.0` | `0.5.0` / `0.4.0` / `0.4.0` | `0.26.0-rc.grammar.1` / `0.5.0-rc.grammar.1` |
| `grammar.2` | `0.4.0` / `0.3.0` | `0.6.0` / `0.4.0` / `0.4.0` | `0.27.0-rc.grammar.2` / `0.5.0-rc.grammar.2` |

These rows preserve their original coordinates and accepted-design hashes; none
is silently retargeted or turned into a current fallback. All remain
`SUPERSEDED_UNPUBLISHED_TARGET` records, not registry observations.

## 4. Historical reference-asset observations

The two public reference assets in `aikdna/kdna-assets`
(`@aikdna/laozi-wuwei` and `@aikdna/epictetus-control-and-character`, both
`0.1.1`) **retain their original bytes and licenses and were rejected with
`READ_CORE_INVALID` by the candidate graph observed on that date** (`checked_at`
2026-09-10, method `public_node_adapter`, recorded in that repository's schema-2
index). Their historical acceptance belongs to the older toolchain recorded with
them; it is not current compatibility.

This matrix therefore makes no "the new line reads the old assets" claim. The
candidate implements no legacy decoder, no conversion and no dual read; a
complete old or unrelated tuple yields an explicit unsupported-version
rejection. The separately recorded `@aikdna/verification-scope@0.1.5` candidate of that earlier contract
has its own exact bytes and observations in the assets README. It is Agent-authored
and Agent-adopted with no human review and no Release coordinate; this does not
upgrade the two historical references or certify the candidate's content quality.
None of these earlier asset observations establishes R2 acceptance;
formal asset migration remains a separately evidenced stage.

Which assets the **published** line accepts is not restated here (UNKNOWN);
verify it against the exact published artifact rather than against this page.

## 5. Verified environments

The table below preserves the earlier component environment records; it is not
a fresh grammar.3 platform run. Current environments must be tied to exact new
artifacts and independently accepted observations. A missing platform is
unverified, not failing, and is not inherited from a neighboring component.

| Component | Environment actually exercised | Source of the statement |
|---|---|---|
| Historical Core / Read candidates | Node.js on the development host; browser entry exercised separately from Node | package READMEs in `packages/kdna-core`, `packages/kdna-read` |
| Assets adapter | macOS arm64, Node.js 26.5.0 | `aikdna/kdna-assets` README |
| Web Host / Web Client / React | Node.js 22 or newer; React 18.3.1 for the React candidate (declared peer range `>=18 <20`) | Web Host, Web Client and React READMEs |
| Demo viewer | Next 16.3.5, React 19.2.7, Playwright WebKit 1.61.1, loopback only | `aikdna/kdna-demo-web-viewer` README |
| VS Code extension | VS Code 1.130.0 or newer, trusted workspace, unpublished local candidate | `aikdna/kdna-vscode` README |
| Swift Core/Read | macOS arm64 native verification and generic iOS device compilation; iOS runtime/native Host are not established | `aikdna/kdna-core-swift` README |

Node execution of a browser entry is not browser-engine evidence, and a
successful local build is not a platform-coverage claim.

## 6. Not supported, and the alternative path

| Not supported in the candidate line | Alternative path |
|---|---|
| Installing a current candidate from the registry | Use its exact public source and bound inputs; source availability does not establish registry publication |
| Reading an old or unrelated version tuple | None. Rejection is terminal; re-create the asset under the current design |
| ZIP64, data descriptors, unsupported codecs, CBOR tags/indefinite forms, bytestring payloads | Fail closed by design; repackage the input in the supported bounded ZIP32/CBOR subset |
| Implicit encryption, signature and checksums-document admission in ordinary root/browser APIs | These entries retain capability refusal. Explicit [Node protection](../specs/protection-admission.md) has its own providers and inputs; no permission flag or metadata claim enables it implicitly |
| Production identity, durable Host authorization, external verification services and confirmed output delivery | Native 0.3.1 formats and reference admission exist; these external observations and service guarantees require separate evidence |
| Cross-language parity (Swift, Python, other native shells) | Per-language candidates report their own verified environments |
| Transparent upgrade of the published line | None is promised. Maintaining the Active line and publishing a separate new implementation are distinct responsibilities |

For the recorded npm workflow, use the exact published CLI 0.36.1 coordinate
and its matching assets, as described in [`docs/status.md`](./status.md).
For current source, start with [Core/Read](./core-read-current-status.md) and the
owning companion README. The versioned normative status above remains unchanged.

## 7. Per-component reception status

| Surface | Reception status |
|---|---|
| Core / Read R2 | Reference implementation present, unpublished; final-byte independent acceptance remains separate; see [`docs/core-read-current-status.md`](./core-read-current-status.md) |
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
