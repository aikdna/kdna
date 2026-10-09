# Component reception status

> Source descriptions reviewed: 2026-09-14. Environment observations retain
> their original scope. One page, one row per consumer. Each row records
> what that component actually connects to, where it was actually exercised, and
> what it has **not** accepted. The owning repository README remains the
> implementation statement; this page only indexes it and must not make a row look
> stronger than its source.

## Rules this page follows

- A reference Core/Read pass does not transfer to another language, CLI, Host,
  native shell or third-party Agent.
- Remote authorization, signing, encryption and cross-platform evidence are not
  inherited from the published line or from another Host.
- A component that already states an honest boundary (for example
  "pre-release", "experimental" or "unassessed") keeps that wording. It is not
  upgraded into general production availability to make the ecosystem look
  finished.
- `NOT_RUN`, `NOT_PROVEN` and "unassessed" are recorded as-is.

## Reception by consumer

| Component | Connects to | Actually exercised in | Accepted paths | Not accepted / not proven |
|---|---|---|---|---|
| `@aikdna/kdna-cli` | Core/Read candidates `0.24.0-rc.component-semantics.2` / `0.3.0-rc.component-semantics.2` | Node.js on the development host | Explicit-file `inspect`, `validate`, bounded `read` and one-process Read sessions | No authoring, packing, conversion, Plan admission or execution; no remote identity service |
| `@aikdna/kdna-mcp-server` | Fixed CLI `0.38.0-rc.component-semantics.1` / Core / Read candidates | Local stdio candidate, operator-bound | Operator-supplied asset and explicit read permission; catalog, exact selection, mandatory closure | No model-selected paths, no discovery, no permission from `initialize`/tools; native Host delivery and semantic adoption remain unverified |
| `kdna-skills` (`kdna-loader`, `kdna-creator`) | Loader/MCP candidate `0.7.0-rc.component-semantics.1` | Local source and packed stdio candidate | Explicit local catalog/selection/Read guidance; bounded live creation session adapter | Host delivery and semantic adoption `NOT_RUN`; these remain outside the independently verified packed stdio scope |
| `aikdna/kdna-assets` | Core/Read/CLI candidates by exact archive and installed-file digest | macOS arm64, Node.js 26.5.0 | Index validation, Core outcome audit, explicit Read audit; separately recorded current candidate | Two historical references remain rejected with `READ_CORE_INVALID`; current candidate has no human review or Release coordinate |
| `aikdna/kdna-work-releases` | Not a runtime consumer | - | Verifies published artifacts against checksums and minisign signatures when they exist | No installers or update feed published; download endpoints return `410 Gone` |

## Current source entry points

These links locate implementation instructions and exact inputs. They do not
add platform acceptance, registry publication, human adoption or native Host
support to the environment table above.

| Integration | Owning source contract |
|---|---|
| Terminal consumption | [CLI](https://github.com/aikdna/kdna-cli#readme): explicit-file Core admission and bounded public Read |
| Creation engine and terminal Host | [Studio Core](https://github.com/aikdna/kdna-studio-core#readme) and [Studio CLI](https://github.com/aikdna/kdna-studio-cli#readme): live creation, saved-byte checks and static verification remain separate |
| Python | [Python Core/Read](../python-sdk/README.md): its own pinned contract, standard-library implementation and measured environment |
| Agent and MCP | [Skills/MCP](https://github.com/aikdna/kdna-skills#readme): explicit adapters and scoped execution evidence |

## What would change a row

A row changes only when the owning repository produces its own same-version
evidence: an exact dependency graph, the observed environment, and the recorded
outcome. A neighboring component passing, or a candidate existing in a working
tree, is not that evidence.

## Related documents

- [`docs/version-and-capability-matrix.md`](./version-and-capability-matrix.md)
  - published-versus-candidate coordinates.
- [`docs/core-read-current-status.md`](./core-read-current-status.md) - the
  Core/Read implementation status behind every row above.
