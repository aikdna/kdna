# Open Ecosystem Readiness

KDNA has completed the asset-first protocol layer. The next open-source bar is
ecosystem dependability: external developers should be able to integrate,
verify, publish, and contribute without relying on private project knowledge.

## P0 Readiness Gates

- `@aikdna/kdna-core` exposes stable public asset APIs.
- Conformance tests exist for loaders and validators.
- (Registry is out of scope for KDNA Core; see 00-current-truth.md.)

## P1 Readiness Gates

- MCP adapter exists for agent runtimes.
- Reference domains publish limitations, evals, and benchmark evidence.
- Skill + KDNA demo explains judgment-layer separation.
- RFC index defines protocol participation path.
- Web package path is implemented, published, and smoke-tested end to end:
  `kdna-web-server` -> `kdna-web-client` -> `kdna-react` ->
  `create-kdna-web-app`.

## Completion Criteria

An external developer can:

1. Load and inspect a `.kdna` asset with `kdna-core`.
2. Run conformance tests to check compatibility.
3. (Registry is out of scope; see 00-current-truth.md. Local asset creation via `kdna demo` / `kdna pack` / `kdna-studio-cli` is the supported path.)
4. Connect KDNA to an agent through MCP or a loader skill.
5. Scaffold a KDNA web application from published packages and complete an
   upload -> inspect -> plan-load -> load flow using only published
   documentation.
