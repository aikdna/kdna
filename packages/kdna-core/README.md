# KDNA Core — public component revision

Unpublished release candidate for the public KDNA contract. The npm package target is `0.24.0-rc.component-semantics.2`; its protocol coordinate is `kdna.core/0.3.0`, with Container/Payload `0.2.0` and Canonical IR `0.2.0`. Acceptance and publication are separate steps.

Core admits one immutable container, validates its Manifest and typed Payload, resolves the static graph, computes A/C/E and Canonical IR digests, and issues a private snapshot. Risk and noncritical extensions remain authored declarations, with presence and order preserved. Unsupported critical semantics fail closed. Core performs no condition evaluation, quality assessment or authorization.

| Entry | Value exports | Input |
| --- | --- | --- |
| root | `admitBytes` | Uint8Array; stored ZIP entries |
| `/node` | `admitNode` | path, Buffer or Uint8Array; stored/deflate ZIP |
| `/browser` | `admitBrowser` | ArrayBuffer or Uint8Array; synchronous stored/deflate ZIP |
| `/components` | `getComponentSemanticsContract` | Fixed read-only definition descriptor |
| `/read-boundary` | `inspectSnapshot` | Private snapshot; returns a frozen data view or null |

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

The implemented container capability is bounded ZIP32 with contiguous entries, matching local/central names and metadata, CRC validation, and the runtime allowlist. Limits are 25 MiB container, 128 entries, 5 MiB per entry, 12 MiB total decoded content and 100:1 compression ratio. JSON/CBOR values also have bounded depth, array size and string bytes. ZIP64, data descriptors, unsupported codecs, CBOR tags/indefinite forms and bytestring Payload values fail closed. Encryption, signature and checksums-document admission capabilities are unavailable; no metadata claim is treated as cryptographic verification. Digest primitives remain independently testable.

The package includes only the new public-contract implementation and mechanically generated schema/types mirrors. Root exports contain no old API aliases. Historical 0.22 source tests remain in the repository; the package test command runs public admission and component tests. Historical tests require a separate old-line environment and are not evidence for this RC.

See the monorepo's single `specs/public-semantic-source.json`, generation manifest and component revision receipts for exact source, tool, evidence-route and artifact coordinates. Runtime Capsule/Plan admission, external verification services, durable Host policy and cross-language parity are separate responsibilities.

Explicit critical component declarations select the fixed public taxonomy, candidate-set or discriminator-set grammar. Core checks native owner/component/role bindings, exact content and aggregate claims before supplying typed interpretations. The method IR preserves native declarations, authored presence, original content, statement provenance and normalized bodies. No carrier means undeclared, not an empty or guessed mechanism. Invalid component semantics produce a named rejected result with Core valid, interpretation blocked and no snapshot/body.

`getComponentSemanticsContract()` returns a frozen descriptor of the definition digest, profiles, carriers and limits. It accepts no caller-supplied interpreter. A static adoption digest does not establish actual human/Agent adoption or strong Creation. Real creation, identity, Host permission and action authorization remain separate boundaries.
