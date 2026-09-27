# KDNA Core — R2 candidate

UNPUBLISHED `R2` candidate: actual source package `0.36.0-rc.r2.7`, Core `kdna.core/0.8.2`, Container `0.5.0`, Payload `0.5.0`, Canonical IR `0.6.0`, with native Capsule/Plan/Host/Trace `0.3.0`. See the [specification index](../../SPEC-INDEX.md), the [execution contract](../../specs/execution-contract-0.3.md) and the [PackageSet node surface](../../specs/package-set-node.md). Implementation, independent byte-bound acceptance, installed consumer rebinding and publication are separate.

This 2026-09-23 source description follows [`package.json`](package.json).
Read source `0.11.0-rc.r2.7` declares this exact Core peer. Runtime CLI
0.40 and MCP 0.8.1 retain their separate Core 0.34 / Read 0.9 archives; see the
[matching-delivery guide](../../docs/core-read-current-status.md#choose-and-obtain-one-matching-delivery).
Editing this source README does not replace a previously fixed archive or
renew any byte-bound acceptance. Use the manifest and member inventory shipped
with the exact artifact; do not rebuild or substitute it merely to align prose.

Core admits one immutable container, validates its Manifest and typed Payload, resolves the static graph, computes A/C/E and Canonical IR digests, and issues a private snapshot. Risk and noncritical extensions remain authored declarations, with presence and order preserved. Unsupported critical semantics fail closed. Static admission performs no condition evaluation, quality assessment or authorization. The separate execution subpath validates native 0.3.1 objects and coordinates explicitly configured external Host providers; serialized inputs cannot confer trust or permission.

| Entry | Value exports | Input |
| --- | --- | --- |
| root | `admitBytes` | Uint8Array; stored/deflate ZIP entries |
| `/node` | `admitNode` | path, Buffer or Uint8Array; stored/deflate ZIP |
| `/authoring-node` | `openSourceBytes`, `packSourceBytes`, `getAuthoringWorkflowContract` | Producer source operations and fixed workflow descriptor |
| `/browser` | `admitBrowser` | ArrayBuffer or Uint8Array; synchronous stored/deflate ZIP |
| `/components` | `getComponentSemanticsContract`, `getNativeMethodRequirements` | Fixed read-only definitions and native-method requirements |
| `/static-policy` | `getStaticPolicyContract` | Fixed read-only static-policy definition descriptor |
| `/execution` | Native Plan/Capsule/Host/Trace builders, admissions, inspectors and validators | Genuine Core snapshot plus exact public inputs; configured Host providers for execution observations |
| `/package-set-node` | `getPackageSetContract`, `validatePackageSetStructure`, `createTrustedPackageSetMemberProvider`, `admitPackageSetNode`, `recheckPackageSet`, `inspectAdmittedPackageSet`, `verifyPackageSetHandoff` | Real complete member bytes, a closed PackageSet and an installer-branded member provider; the accepted R07 order and genuine snapshots |
| `/remote-runtime` | `loadRemoteRuntimeAsset` | Preserved explicit legacy 0.1 remote loader; independently declared types, no R2 conversion |
| `/read-boundary` | `inspectSnapshot`, `isProtectedSnapshot` | Pure private-snapshot probes; availability is not current authority |
| `/protection-node` | `getProtectionContract`, `admitProtectedNode`, `bindProtectionOperation`, `disposeProtectionOperation`, `protectSourceBytes` | Explicit Node protection, trusted provider and opaque operation |

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

Accepted and rejected results are closed objects. Rejections contain sanitized fixed diagnostics. A serialized or copied snapshot cannot recreate its witness. Snapshot identity belongs to one installed Core instance; a duplicate installation rejects foreign witnesses. Each new admission has a new snapshot ID. A retained snapshot remains immutable even if the original input bytes change.

Official rejections retain their existing codes and state boundaries; available `subject` and `field` coordinates identify the rejected source location, including schema and dependency producer/contract errors. They do not echo arbitrary rejected values, add a second validation authority or downgrade a failure. Consumers may present these coordinates but must not interpret the presence or absence of a particular diagnostic field as content acceptance.

The implemented container capability is bounded ZIP32 with contiguous entries, matching local/central names and metadata, CRC validation, and the runtime allowlist. Limits are 25 MiB container, 128 entries, 8 MiB per entry, 12 MiB total decoded content and 100:1 compression ratio. JSON/CBOR values also have bounded depth, array size and string bytes. ZIP64, data descriptors, unsupported codecs, CBOR tags/indefinite forms and bytestring Payload values fail closed. Ordinary root, `/node` and `/browser` admission refuse encryption, signature and checksums-document inputs; explicit `/protection-node` admission has a separate contract and trusted providers. No metadata claim is treated as cryptographic verification. Digest primitives remain independently testable.

The root exports only the current public admission API. Generated schemas/types and explicit execution and remote-runtime subpaths are packed with their complete dependency and type closures. The remote-runtime subpath preserves the separate legacy 0.1 contract. Public regressions run with `npm test` in this package; the complete source test collection also checks retained legacy modules through their actual internal or explicit public entry points. A legacy test does not establish new-line acceptance.

The separate Node producer entry opens raw Manifest/Payload only after the same Core admission used by consumers. `openSourceBytes(bytes)` returns an accepted `source` with detached `manifest`, `payload`, every allowed `members` entry (`name`, `type: 'file'`, raw ZIP Unix `mode`, independent `bytes`), per-member SHA-256 `inventory`, and the exact input `artifact_digest`. A zero mode preserves the predecessor's unspecified mode. Rejections return the existing sanitized Core result, with no source or bytes. Consumer entry points never expose this source view.

`packSourceBytes(predecessorBytes, {manifest?, payload?})` accepts full replacement values for the explicitly edited members, reopens the exact predecessor, preserves all other members, and admits the resulting stored ZIP with the same Core before returning `{status: 'accepted', bytes, source, proof_limits}`. `{}` is an admitted no-edit repack. Unknown edit keys, unknown source fields, invalid references and unsupported semantics fail closed. There is no attachment addition, deletion or replacement input. Unedited members retain their bytes, names, file type and mode. ZIP compression, timestamps, extra fields, comments and whole-container bytes are not preserved.

When edits are present, already declared well-formed `content_digest` and `authoring.content_digest` values are mechanically refreshed using the existing public C preimage (which excludes precisely those bindings); absent fields stay absent. Malformed declarations remain invalid. No other property, license, lineage or extension is added or removed implicitly. Manifest/Payload member hashes may change; callers must compare unedited Payload nodes structurally rather than claim whole-Payload byte preservation.

The producer API operates on bytes only, with no filesystem extraction, attachment execution or hooks. Source access and packing do not prove editing rights, author identity, valid version succession, formal creation completion, content quality or human approval. Those remain responsibilities of the creation workflow and its independent review. The producer workflow itself does not change the component or static-policy definition. This R2 package nevertheless requires explicit rebinding to its complete new tuple; no earlier consumer receipt is upgraded automatically.

See the monorepo's single `specs/public-semantic-source.json` and
[`specs/public-generation-manifest.json`](../../specs/public-generation-manifest.json)
for the exact accepted design inputs, generated closure and aggregate digest, and
[`docs/core-read-current-status.md`](../../docs/core-read-current-status.md) for
the dated implementation status. Independent acceptance records are internal
evidence and are not part of this package or this repository. Native 0.3.1 Capsule/Plan admission and configured Host orchestration are implemented by `/execution`; external identity/verification services, durable Host policy, actual output transport delivery and cross-language parity require their own evidence.

`/package-set-node` adds the ordinary PackageSet admission surface inside the existing Core-static-admission boundary. It captures the caller's closed records purely — Proxy, accessor, symbol, custom prototype, sparse array and cycle are refused before any reflection that could fire a trap — copies each member's bytes into an owner-exclusive buffer before the first await, admits every member through the accepted bytes entry, and runs the accepted R07 order `unauthorized -> missing -> extra -> duplicate -> tuple -> Core -> merge -> selection` over independent observations. The internal decider and handoff checker are called, never exported, and a caller-supplied object cannot supply an observation. A malformed PackageSet stays `READ_INPUT_INVALID`; the twelve new local failures never enter the Read wire or `public-diagnostics.json`. Static member admission is not a Read permission, not execution authorization and not a protected PackageSet: this package does not claim any of those.

Explicit critical component declarations select the fixed public taxonomy, candidate-set or discriminator-set grammar. Core checks native owner/component/role bindings, exact content and aggregate claims before supplying typed interpretations. The method IR preserves native declarations, authored presence, original content, statement provenance and normalized bodies. No carrier means undeclared, not an empty or guessed mechanism. Invalid component semantics produce a named rejected result with Core valid, interpretation blocked and no snapshot/body.

`getComponentSemanticsContract()` returns a frozen descriptor of the definition digest, profiles, carriers and limits. It accepts no caller-supplied interpreter. A static adoption digest does not establish actual human/Agent adoption or strong Creation. Real creation, identity, Host permission and action authorization remain separate boundaries.

`getNativeMethodRequirements()` exposes the fixed public native-method requirements with their component-definition digest, so authoring tools can explain Core rejections without copying a private vocabulary or inventing a validator. Open terms are not thereby native methods. These requirements describe structural prerequisites, not a demand to attach every component type to every judgment; a simple judgment need not acquire an artificial method or branch. Formal validity does not establish truth, reasoning quality or completeness of authored explanations.

`getAuthoringWorkflowContract()` returns `kdna.authoring-workflow/2` version `2.0.0` (`id`, `version`, minimum candidates, rules and definition digest) from the single public semantic source. Its rules apply through explicit exact contract adoption, separately bound to the actual producer/consumer identity, package version and dependency bytes. One genuine candidate is allowed, while actual selection and a separate final confirmation or rejection remain required. This new module coordinate replaces no historical /1 evidence and does not itself define the separately versioned R2 Container/Payload/IR/Read/execution tuple. A contract declaration does not prove a tool followed the workflow; concrete implementation evidence remains required. See [the adoption contract](../../specs/authoring-workflow.md).

The opt-in `kdna.static-policy/2` definition gives `priority` one shared meaning: first-matching-priority, at most one candidate. In the explicit direction, a true entry determines its candidate only if all prior conditions are explicitly false. An unknown or unevaluated prior condition cannot be skipped; fallback applies only when every condition is explicitly false. Core only validates and preserves this declaration in the typed `IRNode_judgment.static_policy_interpretation` field; it never evaluates conditions, selects a runtime result or grants action permission. The same owner formation rule must have explicit empty `condition_refs` and no competing native policy in this revision; ordinary judgments need not adopt this module. These candidate packages require independent acceptance and explicit consumer rebinding before any publication claim.


## Explicit Protection Node surface

This surface was introduced in the historical `0.30.0-rc.protection.1` candidate and is present in the current source manifest above. The explicit `/protection-node` entry follows [protection admission](../../specs/protection-admission.md). Closed generated declarations define credentials, trusted providers, opaque operations and disclosure results. Ordinary root/browser APIs retain capability refusal; they do not gain implicit secret handling or I/O. Its current artifact requires its own package/runtime evidence; this source description makes no account-service, product-adoption or publication claim.

## Explicit key-grant issuer surface

Core `0.31.1-rc.grant.2` / Read `0.7.2-rc.grant.2` are historical introduction coordinates, not the current package identity. The current source manifest includes the Node-only `@aikdna/kdna-core/key-grant-issuer-node` subpath with `getExternalGrantIssuerContract()` and `issueExternalKeyGrantForAsset(bytesOrAbsolutePath, options, secrets)`. All signed fields and `timeout_ms` are explicit. The issuer authenticates actual encrypted bytes before wrapping a device grant. Its R2 admission observation preserves complete admission or body-free rejection; unsupported critical meaning cannot enter a catalog fallback. It discloses existing grant metadata, never Payload/IR/CEK, and does not authorize account membership, Read scope or actions. Caller pins issuer identity independently. See `specs/external-grant-issuer.md` in the source distribution.

Four in-flight slots remain owned until I/O and handle closure settle. The unchanged synchronous grant primitive cannot be preempted; deadline checks before/after it and before publication prevent a late grant result, not internal computation already in progress. Account service final transaction/deadline/revocation is separate. Ordinary APIs, protection profiles, tuple and byte domains are unchanged; Read retains protected delivery expiry/history and transport observable-binding checks.
