# Building Commercial Services on KDNA

KDNA is an open judgment-asset protocol. Commercial products may be built on
top of it, but no commercial service is required to create, publish, load, or
use a valid KDNA asset.

## Open Protocol

The public specification, schemas, Core SDK, CLI, authoring tools, loaders, and
conformance fixtures provide the shared foundation. Format validity is
independent of who authored an asset and whether money changes hands.

## Author-Controlled Assets

An author may publish an asset under terms they choose, subject to applicable
law and the license they attach. KDNA Core does not certify the author's
expertise, determine content quality, or set a business model.

## Access Models

| Access | Asset boundary | Possible use |
|---|---|---|
| `public` | Content has no secrecy; Agent consumption still uses Capsule | Open reference assets, community releases, freely distributed work |
| `licensed` | Judgment payload is encrypted; authorized projection is loaded in memory | Paid assets, memberships, organization-controlled distribution |
| `remote` | Full judgment payload stays on the author's or deployer's server | Hosted task projection, sensitive organizational judgment |

The author chooses the access mode. The toolchain enforces declared access and
authorization facts; it does not judge the asset's content.

## Services the Ecosystem May Build

Independent creators and companies may offer authoring help, hosting,
distribution, discovery, evaluation, integration, licensing, support, or
domain-specific applications. These are products built on KDNA, not required
parts of KDNA Core and not evidence that AIKDNA endorses their content.

## Current Public Availability

The public baseline includes the protocol, local toolchain, self-publication,
and self-hostable reference components. AIKDNA-hosted marketplace, billing,
registry, certification, and remote loading are not current public services.
Check each package's release notes before relying on licensed or remote flows
in production.
