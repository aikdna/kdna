# KDNA Maturity Disclosure

> **Current product maturity: Beta.** This page separates protocol validity,
> implementation maturity, and optional asset evidence.

## What Beta Means

The KDNA Asset Container and local public-asset path are stable enough for
integration and conformance testing. Other layers mature independently. A
stable container does not make every runtime, adapter, server, or asset
production-ready.

| Surface | Maturity |
|---|---|
| Asset container, manifest, CBOR payload, checksums | Stable baseline |
| Local public `validate → plan-load → load` | Stable baseline |
| Runtime Capsule contract | Stable baseline in the JS reference path |
| Studio authoring/export | Beta |
| Single-asset task-aware runtime | Beta |
| Cluster runtime and Cluster Assay | Beta |
| Signing and revocation | Beta |
| Licensed access and encrypted lifecycle | Candidate; confirm release-specific conformance |
| Remote access protocol | Candidate |
| Remote and activation reference servers | Experimental and self-hosted |
| Swift, React, and Web parity | Beta / experimental by repository |

## Four Things That Must Not Be Collapsed

1. **Format validity** — the asset follows the KDNA container and schema.
2. **Integrity and provenance** — bytes, digests, and optional signatures agree.
3. **Behavior evidence** — an optional evaluation observed a result.
4. **Product readiness** — a specific application or deployment accepts the
   operational risk.

Passing one layer does not imply the others. KDNA Core never converts these
facts into a judgment that the content is correct, high-quality, or officially
recommended.

## Asset Creation and Publication

Anyone can create, package, publish, modify, and distribute a KDNA asset
through the public protocol and toolchain. Evidence, review, signature,
registry listing, or AIKDNA approval are not creation requirements.

Authors choose whether an asset is public, licensed, or remote. Consumers
choose which authors, evidence, signatures, and policies they require.

## Package Versions and the Asset Format

Toolchain packages use their own release versions. Those package versions are
not separate KDNA product formats. Active user documentation describes one
current KDNA Asset Container; schema and protocol documents carry the technical
compatibility identifiers needed by implementations.

## Not in the Public Baseline

- an AIKDNA-hosted registry or universal discovery service;
- a marketplace, billing service, or mandatory commercial platform;
- an AIKDNA-hosted remote loading endpoint;
- universal content ranking, certification, or recommendation;
- a guarantee that an asset improves every model or task;
- a complete memory, learning, evaluation, or deployment platform.

For a specific package, use its release notes and CI evidence. For product
boundaries, see [Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
