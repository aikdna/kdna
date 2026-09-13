# Core and Read: current implementation status

> Status date: 2026-09-13. Scope: the **unpublished** Core and Read release
> candidates in this repository.
>
> This page exists so that three different things stay separate: the frozen
> design inputs, the implementation status, and the public usage instructions.
> It does not convert a local candidate into a published artifact, and it does
> not upgrade any frozen `NOT_IMPLEMENTED` or `NOT_RUN` material into a pass.

## What is frozen, and how you can tell

The design inputs are recorded byte-exactly in
[`specs/public-generation-manifest.json`](../specs/public-generation-manifest.json).
The generator fails with `DESIGN_DRIFT` if any of them changes, so their bytes
are an input, not prose to be edited. At the date above:

| Frozen input | Bytes | SHA-256 |
|---|---:|---|
| `SPEC-INDEX.md` | 4870 | `34d6a900d065ff4239dd6c8359cbdb9c7b0ee56caa91713e6761c41997515091` |
| `specs/read-contract.md` | 52328 | `806b7c10827a4f01ba3fd157ffc1b93397cd2514a3f0e13f98e177258f2b3a4d` |
| `specs/public-version-policy.md` | 7459 | `3f144259b3ef8eef60728c75a8533147f40ccca556710257ad139bf7d6072418` |
| `specs/public-contract-decisions.json` | 26836 | `ab20a236db86dc0d3e028c1cecd7963ff1d368e0d2cc2f56a1ce1686754c832a` |
| `specs/public-source-map.json` | 11787 | `d95cc49644013d3eec5a99ae43d90915fd08c9e837dbd64488d62c76aa3a778b` |
| `conformance/public-contract-decision-vectors.json` | 183385 | `5c22f92527fd93c85c04a1d28d3790455ea5cd06c0df94c56f8fd7446be9e843` |

Those documents keep their original status wording, including sections that say
`NOT_IMPLEMENTED` or `NOT_RUN`. That wording describes the design record at the
time it was written; it is not silently reinterpreted here.

## What the candidates implement

The package READMEs are the normative description of each candidate surface and
are not duplicated on this page. In short, as of the status date:

- Core `0.24.0-rc.component-semantics.2` exposes root `admitBytes`, `/node`
  `admitNode`, `/browser` `admitBrowser`, `/components`
  `getComponentSemanticsContract` and `/read-boundary` `inspectSnapshot`. It
  admits one immutable container, validates the Manifest and typed Payload,
  computes the A/C/E digests and Canonical IR, and issues a private snapshot.
- Read `0.3.0-rc.component-semantics.2` consumes that snapshot and IR, exposes
  request admission plus projection, Host embeddings, a transport receiver and
  types, and produces exactly four output channels.
- Both packages fail closed on unsupported critical semantics and expose a
  named rejection with sanitized diagnostics.

The exact entry-point tables, limits and boundary statements live in
[`packages/kdna-core/README.md`](../packages/kdna-core/README.md) and
[`packages/kdna-read/README.md`](../packages/kdna-read/README.md).

## Quickstart (candidate, local source only)

There is no registry install for these packages. Use the exact local candidate
archive and its exact peer; a version string alone does not identify the tested
graph.

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

## Browser evidence scope

The browser entry points are exercised as their own capability. Node execution
of a `/browser` entry is not browser-engine evidence, and a recorded browser run
covers only the browser, engine and OS version actually observed. Cross-platform
browser coverage, native shells and WKWebView stay separate items.

## Still separate responsibilities

These are not implied by the paragraphs above and each needs its own evidence:

- Runtime Capsule and Consumption Plan admission.
- External verification services, durable Host policy and identity.
- Cross-language parity (Swift, Python and other native implementations).
- Registry publication, release notes and download artifacts.
- Any real asset acceptance: the current reference assets are rejected by this
  graph, so a working sample set must be created and accepted on its own bytes.

## Where this material lives

Private dispatch notes, receipt identifiers and task coordinates are internal
evidence. They are deliberately absent from this page: everything a reader
needs is reachable from this repository. See also
[`docs/version-and-capability-matrix.md`](./version-and-capability-matrix.md)
for the published-versus-candidate coordinate table.
