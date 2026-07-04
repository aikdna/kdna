# KDNA Public Roadmap

> Last updated: 2026-07-04. This is the public-facing roadmap summary.
> Detailed sprint planning is internal.

## Where we are

The KDNA Core v1 local public asset path is the current public baseline. The
protocol, CLI, Core runtime, and Studio authoring tools are usable today for
creating, validating, planning, and loading local public `.kdna` assets.

Do not read this as a claim that every support surface is stable. Hosted
registry, marketplace, paid distribution, AIKDNA-hosted loading, and broad
cross-language parity are not part of the stable public baseline.

| Layer | Status | What shipped |
|---|---|---|
| **File format** | Stable | Container layout, manifest schema, payload profile v1, checksums |
| **Runtime loading** | Stable | `kdna load`, `kdna validate`, `kdna plan-load`, `kdna pack`, `kdna unpack` |
| **Identity & trust** | Beta | Ed25519 signing, signature verification, trust levels, deprecation signaling |
| **Revocation** | Beta | Signed revocation records, revocation status checks, cross-key attack resistance |
| **Watermarking** | Beta | Payload-level HMAC tracing for licensed and remote assets |
| **Composition** | Beta | Bundle payload type, dependency runtime, topological ordering, conflict analysis |
| **Remote runtime** | Experimental | Self-hostable remote projection server, CLI remote-mode client |
| **Activation server** | Experimental | Self-hostable activation server for licensed asset entitlements |
| **Asset inheritance** | Beta | `extends` field, axiom / boundary merge semantics |
| **RAG namespacing** | Beta | `rag_namespace` isolation per Bundle component |
| **Audit logging** | Beta | Local audit trail for load events |
| **Context budget** | Beta | Token cost reporting in `plan-load` output |
| **Studio authoring** | Beta | `kdna-studio create`, `import`, `distill`, `card`, `export` |
| **Agent integration** | Beta | `kdna-loader` skill for OpenCode, Codex, Claude Code, Cursor |
| **Web packages** | Experimental | Public repos and npm packages are published; generated-app smoke path is verified |

## What's available now

- **`@aikdna/kdna-cli` v0.28.35** - runtime CLI
- **`@aikdna/kdna-core` v0.15.11** - embeddable JS runtime library
- **`@aikdna/kdna-studio-cli` v0.8.12** - authoring CLI on npm
- **`@aikdna/kdna-studio-core` v1.7.10** - authoring SDK on npm
- **`@aikdna/kdna-mcp-server` v0.2.4** - experimental MCP bridge
- **`@aikdna/kdna-remote-server` v0.1.0** - experimental self-hostable projection server
- **`@aikdna/kdna-activation-server` v0.1.0** - experimental self-hostable activation server
- **`@aikdna/kdna-web-server` v0.1.1** - experimental server-side web adapter
- **`@aikdna/kdna-web-client` v0.1.1** - experimental browser-safe web utilities
- **`@aikdna/kdna-react` v0.1.1** - experimental React hooks and components
- **`create-kdna-web-app` v0.1.1** - experimental KDNA web app scaffolder
- **Public assets**: see `aikdna/kdna-assets` `assets.json` and GitHub Releases

## What comes next

The next phase focuses on four areas:

### 1. Maintenance-mode baseline

The open-source layer is moving from expansion to maintenance. See
[Open Source Maintenance Baseline](./open-source-maintenance-baseline.md) for
the accepted contribution types, stable/beta/experimental boundaries, rejected
Core v1 scope, and minimum release evidence matrix.

### 2. Web package maintenance path

The four public web package repositories are published and source/npm versions
are aligned:

- `kdna-web-server`
- `kdna-web-client`
- `kdna-react`
- `create-kdna-web-app`

Treat them as experimental integration surfaces, not a stable hosted platform.
The current web server MVP is intentionally narrow: upload/inspect/plan-load/load
plus activation proxying. Server-side Studio export, remote forwarding, CORS
policy helpers, and durable Cloudflare/R2 storage remain future web-package
work.

### 3. More public assets

A protocol without content is an empty container. The bottleneck is not more protocol features — it's high-quality `.kdna` assets that demonstrate what judgment-in-a-file actually feels like.

We are looking for domain experts who want to package their judgment. If you have a domain where you consistently apply specific principles, boundaries, and standards that a generalist wouldn't have — that's exactly what KDNA is designed for. Read the [30-minute authoring guide](./30-minute-authoring-guide.md).

### 4. Applications built on KDNA

`.kdna` assets are not only for personal agent configuration — they are the judgment layer that applications can build on top of. When an application's core reasoning is a versioned `.kdna` asset, upgrading the asset improves every user's output on the same day. This is KDNA as infrastructure, not just as personal tooling.

Applications in this direction are in development. The local public asset path
is ready; web adapters are available as experimental integration surfaces.

### 5. Native app experience

The current path is CLI + MCP. Native app experiences for loading, comparing, and authoring `.kdna` assets are in development. Swift runtime parity (`kdna-core-swift`) is a prerequisite for full native integration.

### 6. Test coverage and reliability

`@aikdna/kdna-cli` has more than 200 tests but several high-complexity command
modules (agent, cluster, compare, diff) lack unit tests. Good first
issues are available for contributors — see [open issues](https://github.com/aikdna/kdna-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## What is not planned

KDNA Core is **not** building:

- A public registry or marketplace
- Content ranking, certification, or quality badges
- A paid distribution platform
- OCI / container registry distribution
- A hosted loading service

These are concerns for external platforms. KDNA Core provides the
open format, the official toolchain, and the self-hosting primitives.
Everything else is out of scope.

## How to contribute

- **File a bug or feature request**: [aikdna/kdna](https://github.com/aikdna/kdna/issues) or [aikdna/kdna-cli](https://github.com/aikdna/kdna-cli/issues)
- **Contribute a KDNA asset**: [aikdna/kdna-assets](https://github.com/aikdna/kdna-assets) — open an issue describing the domain
- **Add a test**: pick a `good first issue` in [kdna-cli](https://github.com/aikdna/kdna-cli/issues?q=label%3A%22good+first+issue%22) or [kdna](https://github.com/aikdna/kdna/issues?q=label%3A%22good+first+issue%22)
- **Port to another language**: the conformance suite is in `aikdna/kdna/conformance/`. A port is valid if it passes all test vectors.
- **Discuss**: [GitHub Discussions](https://github.com/aikdna/kdna/discussions)
