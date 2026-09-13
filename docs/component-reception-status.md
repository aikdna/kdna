# Component reception status

> Last verified: 2026-09-13. One page, one row per consumer. Each row records
> what that component actually connects to, where it was actually exercised, and
> what it has **not** accepted. The owning repository README remains the
> normative statement; this page only indexes it and must not make a row look
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
| `@aikdna/kdna-cli` | Core/Read candidates `0.24.0-rc.component-semantics.2` / `0.3.0-rc.component-semantics.2` | Node.js on the development host | Local explicit-file admission, creation, export, verification and bounded Read | Remote/identity services, cross-platform shells; independent acceptance pending |
| `@aikdna/kdna-web-server` | The same Core/Read candidates; published adapter `0.3.1` remains the installable line | Node.js on the development host; the reference Host is unpublished | Default stateless deny-by-default Host, explicit retained session, Express and Next adapters, four Read transport channels | No identity service, no persistent upload store, no action authorization |
| `@aikdna/kdna-web-client` | Bound public Core and Read candidates as `peerDependencies`; one explicit HTTP endpoint supplied by the application | Node.js 22+, in-process Request/Response; a loopback reference Host fixture for the separate `test:http` run | Explicit local file selection, one explicit remote Read, bounded codes, `releaseKDNASelection`, `dispose` | No implicit server, no remote identity, no replay prevention, no raw HTTP framing proof, no cross-request expansion |
| `@aikdna/kdna-react` | Web Client candidate `0.5.0-rc.component-semantics.1` | React 18.3.1 with in-process fixtures | `useKDNARead`, `KDNAFileInput`, `KDNAReadStatus`, `KDNAReadView`; explicit read only | Cross-request expansion `NOT_PROVEN`; other React peers need their own verification |
| `@aikdna/kdna-mcp-server` | Fixed CLI `0.38.0-rc.component-semantics.1` / Core / Read candidates | Local stdio candidate, operator-bound | Operator-supplied asset and explicit read permission; catalog, exact selection, mandatory closure | No model-selected paths, no discovery, no permission from `initialize`/tools; independent acceptance pending |
| `kdna-skills` (`kdna-loader`, `kdna-creator`) | Loader/MCP candidate `0.7.0-rc.component-semantics.1` | Local source and packed stdio candidate | Explicit local catalog/selection/Read guidance; bounded live creation session adapter | Host delivery and semantic adoption `NOT_RUN`; forward test pending |
| `kdna-vscode` | Core/Read/CLI local candidates | VS Code 1.130.0+ with a trusted workspace | Read-only preview, exact judgment selection, technical inspect, cancellation | Unpublished; no Marketplace release; project-view commands, pack/unpack, creation and attachment execution unavailable in this slice |
| `kdna-core-swift` | `kdna.core/0.3.0`, `kdna.canonical-ir/0.2.0`, `kdna.read/0.2.0` | Installed macOS arm64 toolchain only | Native admission, inspection, projection and async Read with explicit Host providers | iOS, Linux, Windows, Tauri and WKWebView unverified; no public tag or registry release |
| `aikdna/kdna-assets` | Core/Read/CLI candidates by exact archive and installed-file digest | macOS arm64, Node.js 26.5.0 | Index validation, Core outcome audit, explicit Read audit | Public reference assets are rejected with `READ_CORE_INVALID`; no registry publication configured |
| `aikdna/kdna-demo-web-viewer` | Two exact vendored graphs (browser/Next and private Host) | Chrome and Playwright WebKit 1.61.1 on loopback ports | One explicit public Read at a time | Cross-request expansion unsupported; not a Reader product, no multi-user or internet deployment |
| `aikdna/kdna-work-releases` | Not a runtime consumer | - | Verifies published artifacts against checksums and minisign signatures when they exist | No installers or update feed published; download endpoints return `410 Gone` |

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
