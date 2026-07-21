# KDNA Public Status

> Current public status. Version-specific availability belongs in package
> release notes; this page describes product-layer maturity.

## Product Position

KDNA is an open judgment-asset protocol. Anyone can create a `.kdna` asset.
KDNA Core validates structure, integrity, provenance, and authorization facts;
it does not judge whether asset content is correct, useful, expert, or worthy
of publication.

There is one current KDNA Asset Container and one compatible Host consumption
contract:

```text
inspect → LoadPlan → authorization → load/project → Runtime Capsule → Agent
```

A single explicitly selected file or exact user-approved attachment is the
foundation and default path. A global asset library, automatic discovery, and
an Agent-installed Skill are not protocol requirements.

## Maturity by Layer

| Layer | Status | Public meaning |
|---|---|---|
| KDNA Asset Container | Pre-release | Current mimetype, manifest, CBOR payload, checksums, and container rules; exact-version contract under reconciliation |
| Local public-asset runtime | Pre-release | `inspect`, `validate`, `plan-load`, `load`, `pack`, `unpack`, Runtime Capsule |
| Authoring toolchain | Pre-release | Studio project, card, compile, and `.kdna` export paths |
| Licensed access | Candidate | Public authorization and encryption contracts; verify the release-specific lifecycle before production use |
| Remote access | Candidate | Remote access mode and projection contracts are public |
| Remote/activation reference servers | Experimental | Self-hostable implementations; no AIKDNA-hosted service is part of the baseline |
| Signing and revocation | Pre-release | Integrity and provenance mechanisms, not content endorsement |
| Single-asset consumption runtime | Pre-release | Explicit-file planning, projection, and trace surfaces |
| Cluster and policy runtime | Experimental | Published advanced surfaces under product recertification; not the default path |
| JS Core | Reference implementation | Primary public conformance implementation |
| Eval package | Experimental | Issuer-scoped replay, budget, and consumption evaluation; not Core authority |
| `@aikdna/kdna` compatibility package | Legacy compatibility | Maintained migration bridge; not the recommended new integration path |
| Swift, Agent, editor, React, and Web integrations | Pre-release / experimental / unassessed | Check each repository's exact version and evidence; `kdna-loader` is currently Unassessed |

## Current First-Run Path

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal /tmp/minimal-source
kdna pack /tmp/minimal-source /tmp/minimal.kdna
kdna validate /tmp/minimal.kdna
kdna plan-load /tmp/minimal.kdna
kdna load /tmp/minimal.kdna --profile=compact --as=prompt
```

For authoring:

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create ./my-domain --name @me/my-domain
kdna-studio export ./my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
```

## Public Boundaries

- A valid asset does not need behavioral evidence, human review, official
  approval, or registry listing.
- Evidence can support a claim about observed behavior; it does not decide who
  may create or publish.
- Public reference assets demonstrate the ecosystem. They are not official
  judgments and are not the protocol's content supply strategy.
- A compatible runtime implements LoadPlan, authorization, integrity checks,
  and Runtime Capsule output. Raw unpacking or decoding is not an Agent
  consumption implementation.
- Saving or finding a file is not authorization. Hosts must show active asset,
  version or digest, scope, and reason, with disable/switch/rollback controls.
- Hosted registry, marketplace, billing, and AIKDNA-hosted loading are not part
  of the current public baseline.

See [Maturity](./maturity.md), [Public Roadmap](./public-roadmap.md), and
[Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
