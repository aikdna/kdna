# Repository Boundaries — What Is Public

KDNA's public commitment surface is its set of **public repositories**. This page states
what that surface covers, what remains private, and how the two are kept separate.

## Public repositories

The public repositories under this organization are the public commitment surface:

- protocol and specifications (`kdna`)
- CLI, Skills/MCP adapters, Studio Core/CLI, Swift Core and Swift Studio packages
- the public asset-release repository and the binary-only Work release channel
  (distribution gated)

Everything documented, linked and versioned on this public surface — READMEs,
specifications, published npm/PyPI coordinates, releases and the website — is the
public API and support commitment. Within it, each repository's README states its own
scope, supported versions and limits.

## Private repositories

Some repositories are **private**. They cover areas such as:

- Apple-ecosystem application integration work in progress,
- commercial and product experiments,
- internal operations and coordination.

For these repositories:

- their **names and contents are not public** and are not listed here;
- they are **not part of the public API, documentation or support commitment**;
- public pages do not link to them — if a repository is not reachable from the public
  documentation, it is not part of the public surface.

Private status is not a quality statement. A repository may become public when its
owners decide its content, licensing and documentation meet the public standard;
that decision is made per repository and announced through normal releases.

## The internal whitepaper working repository

The internal whitepaper and judgment-system working repository is **permanently
private**. It holds unpublished drafts, internal records and private material. The
working repository itself is not a publication surface. Any public release derived
from it — the whitepaper `.kdna` asset, or a separately reviewed public asset
repository — is an explicit, per-unit publication decision.

## How this boundary is maintained

- Public documentation links only public repositories.
- Published package metadata points at public sources.
- Questions about unreleased or private work are answered by what is actually
  published, not by private material.

See also [current release support](./current-release-support.md) and
[FORK_POLICY](../FORK_POLICY.md).
