# KDNA Public Roadmap

## One definition

KDNA is an open file format and protocol for expressible judgment and judgment
systems. It gives implicit, scattered, or hard-won judgment an independent file
with clear identity, version lineage, byte integrity, optional local password
encryption, and a scoped reading contract—so people can read and question a work
in [KDNA Reader](https://aikdna.com/en/downloads), and compatible agents can create,
verify, and apply it without silently flattening its boundaries.

KDNA does not claim to add model intelligence or guarantee better output. Its
job is making selected judgment inspectable, portable, versioned, and bounded
across tools.

## Permanently account-free foundation

Public, local, and password-protected (`0.6.0`) `.kdna` creation, encryption
(`kdna protect`), validation, human reading in KDNA Reader, and Agent
consumption are **permanently account-free** and work offline. No online account
system is a prerequisite or roadmap item for the KDNA format, CLI, Skills, or
KDNA Reader.

## One ecosystem, focused responsibilities

The public repositories form an open ecosystem whose components carry distinct
responsibilities and independent release schedules:

| Responsibility | Public Repositories / Surfaces | Mission |
| --- | --- | --- |
| Protocol and Core | `kdna` (`@aikdna/kdna-core`, `@aikdna/kdna-read`) | Container `0.6.0` / `0.5.0` schemas, digests, local password protection, scoped Read closure, and conformance vectors |
| Official CLI | `kdna-cli` (`@aikdna/kdna-cli`) | Author (`init`, `validate-input`, `compile`, `create`), password-protect (`protect`), inspect, validate, selectively read (`read`), compare (`diff`), and revise (`source-open` / `source-pack`) `.kdna` works (`plan`/`load` belong only to the historical `0.36.1` line) |
| Agent integration | `kdna-skills` (`kdna-vscode` paused 2026-10-24) | Agent Skills (`kdna-creator`, `kdna-loader`) and optional local stdio MCP server (`kdna-vscode` remains paused by owner decision) |
| Public reference works | `kdna-assets` | Openly licensed `.kdna` judgment works (starting with bilingual *KDNA Whitepaper* `v1.0.1`, `CC BY 4.0`) and verification checks |
| Human reading | [KDNA Reader for macOS](https://aikdna.com/en/downloads) | Free, permanently account-free macOS desktop reading and review application (with *KDNA Whitepaper* `v1.0.1` built in) for public, local, and password-protected `.kdna` works |
| Studio session packages | `@aikdna/kdna-studio-core`, `@aikdna/kdna-studio-cli` | Separate container `0.5.0` session authoring and protected export line |
| Apple Swift packages | `kdna-core-swift`, `kdna-app-shared`, `kdna-studio-swift` | Swift runtime and Apple-platform contracts |

Per [Repository Boundaries](./repository-boundaries.md), web ecosystem packages and remote/activation services (`kdna-web-client`, `kdna-web-server`, `kdna-react`, `create-kdna-web-app`, `kdna-demo-web-viewer`, `kdna-activation-server`, `kdna-remote-server`) are private repositories, not current public repositories or public support commitments.

## Four questions kept distinct

Ongoing engineering keeps four questions separate:

1. Is the protocol contract internally sound and unambiguous?
2. Does a specific tool or integration faithfully implement its declared contract?
3. What exact compatibility and maturity does a published version promise?
4. When does a real author or reader genuinely benefit from `.kdna` over a simpler note or prompt?

Maturity is stated per component and version rather than assumed from repository
activity or test count alone.

## Claim boundary

KDNA does not claim to increase model intelligence, improve output by a fixed
percentage, or replace ordinary Markdown notes, prompts, or Skills when those
simpler carriers already suffice. Protocol and toolchain verification focuses on:

- container identity, version lineage, and cryptographic byte integrity;
- faithful preservation of authored claims, premises, stop boundaries, and anti-misuse rules during scoped reads;
- offline local password encryption (`0.6.0`), deterministic diffing, and explicit revision;
- explicit, fail-closed diagnostics when a container or version contract is unsupported.

## Current priorities

1. Keep the native `0.6.0` authoring, local password protection, human reading, and selective Agent reading loop effortless and rock-solid.
2. Expand openly licensed `.kdna` reference works in `kdna-assets` with clear authorship and `CC BY 4.0` provenance.
3. Measure and optimize real-world Agent context budgets across `catalog` and `exact_selection` workflows ([Read cost work package](./read-cost-work-package.md)).
4. Maintain clear file-first, user-consented Agent host workflows (`kdna-loader` and `kdna-creator`) with zero silent background activation.
5. Keep every published npm coordinate immutable and byte-verified; new versions advance only after passing conformance and smoke checks without overwriting prior coordinates.

## Contribution boundary

Contributions should strengthen how judgment works are authored, verified,
protected locally, read by humans, or selectively consumed by compatible agents.
Generalized intelligence-enhancement claims are out of scope. Changes to a
repository's mission or lifecycle require an explicit maintainer decision
documented in the repository itself.
