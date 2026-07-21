# KDNA Maturity Disclosure

> **Current product maturity: Pre-release.** This page separates exact-version
> protocol validity, component maturity, and optional asset evidence.

## What Pre-release Means

KDNA has published 0.x protocol, toolchain, and integration snapshots, but the
ecosystem is correcting contract and narrative inconsistencies before its next
Development Preview. A released package proves that exact artifact exists; it
does not make the whole ecosystem stable or make components outside one release
wave valueless.

| Surface | Maturity |
|---|---|
| Asset container, manifest, CBOR payload, checksums | Pre-release; exact-version contract under reconciliation |
| Local `validate → plan-load → load` | Pre-release; verify against the exact CLI/Core pair |
| Runtime Capsule contract | Pre-release in the JS reference path |
| Studio authoring/export | Pre-release; authoring fidelity under review |
| Explicit-file single-asset consumption | Pre-release by exact command |
| Global store, automatic discovery, Skill routing, and multi-asset policy | Published or experimental surfaces under recertification; not the default user contract |
| Signing, revocation, licensed and encrypted lifecycle | Pre-release; security contracts under review |
| Remote and activation reference servers | Pre-release integrations; self-hosted |
| Swift, Agent, editor, React, and Web integrations | Pre-release, experimental, or unassessed by repository and exact version |

## Four Things That Must Not Be Collapsed

1. **Format validity** — the asset follows the KDNA container and schema.
2. **Integrity and provenance** — bytes, digests, and optional signatures agree.
3. **Behavior evidence** — an optional evaluation observed a result.
4. **Product readiness** — a specific application or deployment accepts the
   operational risk.

Storage, attachment, authorization, applicability, and load are also separate
events. No maturity label collapses them into automatic consent.

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

## Not Required by the Core Container

- a hosted registry or universal discovery service;
- a marketplace, billing service, or mandatory commercial platform;
- a hosted remote loading endpoint;
- universal content ranking, certification, or recommendation;
- a guarantee that an asset improves every model or task;
- a complete memory, learning, evaluation, or deployment platform.

Optional services and integrations may exist without becoming mandatory parts
of the container protocol. Their value and maturity are assessed through their
own contracts, users, and release evidence.

For a specific package, use its release notes and CI evidence. For product
boundaries, see [Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
