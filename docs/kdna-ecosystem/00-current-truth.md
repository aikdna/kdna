# Public Ecosystem Truth

> This page contains durable public constraints. Package versions and fresh
> test counts belong in release notes and CI, not in this file.

## Product Truth

- KDNA is an open judgment-asset protocol.
- Anyone, any Agent, or any tool can create and publish a `.kdna` asset through
  the public protocol and toolchain.
- KDNA Core validates format, integrity, provenance, and authorization facts;
  it does not judge content correctness, usefulness, expertise, or quality.
- There is one current KDNA Asset Container and one compatible Agent interface:
  LoadPlan, authorization, integrity checks, and Runtime Capsule.
- A single asset is the atomic and default path.
- Cluster is the explicit advanced path for multiple assets; it does not
  replace or silently alter single-asset loading.
- public, licensed, and remote are author-declared access modes, not content
  rankings.
- Evidence is optional and supports specific observed claims; it is not a
  creation, validation, or loading requirement.
- AIKDNA-published assets are reference assets, not official judgments.

## Maturity Truth

- The KDNA Asset Container and local public-asset runtime are the stable public
  baseline.
- Studio authoring, task-aware consumption, Cluster, signing, and revocation
  are beta surfaces.
- Licensed and remote contracts mature independently from the public container
  path; check release-specific conformance before production use.
- Remote and activation servers are experimental self-hostable reference
  implementations, not AIKDNA-hosted services.
- JS Core is the reference implementation. Swift, React, Web, and Agent
  adapters must prove parity against shared fixtures.

## Not Public Baseline Claims

- hosted registry or marketplace;
- billing or paid distribution platform;
- AIKDNA-hosted remote loading or activation;
- universal asset certification, ranking, or recommendation;
- complete data, memory, learning, evaluation, or deployment infrastructure;
- guaranteed behavior improvement for every model or task.

Keep this file, [Status](../status.md), [Maturity](../maturity.md),
[Public Roadmap](../public-roadmap.md), package READMEs, and website copy
semantically aligned.
