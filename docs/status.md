# KDNA Public Status

> Current public status. Version-specific availability belongs in package
> release notes; this page describes product-layer maturity.

## Product Position

KDNA is an open judgment-asset protocol. Anyone can create a `.kdna` asset.
Core admission establishes technical validity of captured bytes. It does not
authenticate authorship, judge content quality, confirm adoption or grant
reading/action permission.

The current source implementation follows:

```text
explicit bytes → Core admission → private snapshot / Canonical IR
→ public Read under trusted control and Host providers
→ read_envelope | admission_rejection | no_body_control | transport_failure
```

See the [current Core/Read guide](./core-read-current-status.md) and exact package
READMEs. Current R2 Core `/execution` supplies native 0.3.1 static Plan/Capsule
admission and explicitly configured Host reference APIs. Ordinary root, Node and
browser admission refuse encrypted, signed and checksums-bearing containers;
[explicit Node protection](../specs/protection-admission.md) has separate inputs
and trusted providers. These APIs do not establish production identity, durable
authorization, confirmed output delivery or native Host acceptance. The published
CLI 0.36.1 line separately retains `inspect → LoadPlan → authorization
→ load/project → Runtime Capsule`; its assets and APIs are not silently upgraded.

A single explicitly selected file or exact user-approved attachment is the
foundation and default path. A global asset library, automatic discovery, and
an Agent-installed Skill are not protocol requirements.

## Maturity by Layer

| Layer | Status | Public meaning |
|---|---|---|
| KDNA Asset Container | Pre-release | Versioned manifest, payload and container rules; ordinary Core admission refuses protected inputs, while explicit Node protection follows its separate contract |
| Local public-asset runtime | Pre-release | Current CLI source: `inspect`, `validate`, `read`; published CLI 0.36.1 keeps its loading/packing contract |
| Authoring toolchain | Pre-release | Current typed Studio session, saved-bundle verification and explicit Read; project/card APIs belong to published Studio CLI 0.11.0 |
| Licensed access | Candidate | Explicit Node protection admits supported encrypted containers under trusted providers; production accounts and service adoption require separate evidence |
| Remote access | Candidate | Current Read adapters require deployment-owned context and policy; published remote loading has a separate contract |
| Remote and activation references | Experimental | Remote supplies an HTTP Read handler; Activation supplies a co-located store observer, with no standalone server/CLI or AIKDNA-hosted service |
| Signing and revocation | Version-specific | Published Core 0.22.0 signing APIs remain historical. Ordinary Core admission refuses signatures; explicit Node integrity and grant-status checks follow the protection contract and do not establish a production revocation service |
| Single-asset consumption runtime | Pre-release | Current public Read plus optional native 0.3.1 static Plan/Capsule admission and configured Host reference APIs; published loading and trace surfaces retain their own contracts |
| Cluster and policy runtime | Experimental | Published advanced surfaces under product recertification; not the default path |
| JS Core | Reference implementation | Primary public conformance implementation |
| Eval package | Experimental | Issuer-scoped replay, budget, and consumption evaluation; not Core authority |
| `@aikdna/kdna` compatibility package | Legacy compatibility | Maintained migration bridge; not the recommended new integration path |
| Swift, Agent, editor, React, and Web integrations | Pre-release / experimental / unassessed | Check each repository's exact version and evidence; `kdna-loader` is currently Unassessed |

## Current source entry

Use the [Core/Read guide](./core-read-current-status.md) and the
[current CLI source README](https://github.com/aikdna/kdna-cli#readme) with its
exact dependency graph. A source candidate is not an installable npm release.
Current source creation is described by the
[Studio CLI](https://github.com/aikdna/kdna-studio-cli#readme); it does not reuse
the published project/card walkthrough below.

## Published CLI 0.36.1 walkthrough

These commands are pinned to the older published loading line. Their output is
not a current Core/Read compatibility result.

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

For the matching published authoring path (Studio CLI 0.11.0), follow the
[complete authoring guide](./30-minute-authoring-guide.md). Create the project,
add a complete judgment card and confirm its judgment before exporting and
validating the asset. An empty project cannot be exported; creating a project
alone does not complete the authoring workflow.

## Public Boundaries

- A valid asset does not need behavioral evidence, human review, official
  approval, or registry listing.
- Evidence can support a claim about observed behavior; it does not decide who
  may create or publish.
- Public reference assets demonstrate the ecosystem. They are not official
  judgments and are not the protocol's content supply strategy.
- A consumer must implement its exact version contract: current public
  Core/Read or the published LoadPlan/Runtime Capsule line. Raw unpacking or
  decoding is not a compatible consumption implementation.
- Saving or finding a file is not authorization. Hosts must show active asset,
  version or digest, scope, and reason, with disable/switch/rollback controls.
- Hosted registry, marketplace, billing, and AIKDNA-hosted loading are not part
  of the current public baseline.

See [Maturity](./maturity.md), [Public Roadmap](./public-roadmap.md), and
[Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
