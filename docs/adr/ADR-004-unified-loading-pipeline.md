# ADR-004: Unified Loading Pipeline

- **Status**: accepted
- **Date**: 2026-06-25
- **Deciders**: KDNA Core team

## Context

The KDNA ecosystem currently has FOUR independent loading code paths that implement divergent authorization logic:

| Path | Location | Authorization Behavior |
|---|---|---|
| Core `planLoad` + `loadAuthorized` | `kdna-core/src/container/index.js` | Complete state machine, checksums, signature |
| CLI `kdna load` | `kdna-cli/src/cli.js` | Uses `planLoad` but has dead-code fallback |
| Agent `cmdLoad` | `kdna-cli/src/agent.js:339-357` | Bypasses planLoad entirely, checks `manifest.access` directly |
| MCP `loadAssetAuthorized` | `kdna-skills/mcp-server` | Has inline wrapper, partial checks |

The agent.js path bypasses:
- Format/structure validation
- Checksum integrity verification
- Full authorization state machine
- All LoadPlan states (`needs_password`, `needs_account`, etc.)
- Access mode normalization (checks `manifest.access === 'licensed'` but manifest stores `'protected'`)

## Decision

1. **There is ONE allowed production loading sequence:**
   ```
   Bounded read
   → Container identification + security checks
   → Conversion to CanonicalAssetModel
   → Manifest schema validation
   → Checksum / signature verification
   → planLoad (authorization planning)
   → Entitlement / secret acquisition
   → Decryption
   → Post-decryption payload validation
   → Runtime projection
   ```

2. **The following paths MUST be deleted or demoted to internal implementation details:**
   - `agent.js` directly checking `manifest.access`
   - MCP inline authorization logic
   - CLI branching on raw manifest fields
   - Studio implementing its own ZIP or manifest rules
   - Public calls to `loadUnsafe` or direct payload reading

3. **`agent.js` SHALL be rewritten to call Core's unified entry point.** The fix is NOT to add more `licensed || protected` conditions — it is to replace the entire direct-manifest-reading approach with `loadAuthorized()`.

4. **The `loadAuthorized()` function** in Core IS the single gateway for all production consumption. It orchestrates `planLoad()` → credential acquisition → decryption → loading.

## Consequences

- agent.js (350+ lines) must be rewritten to use `loadAuthorized()` (B6 in roadmap).
- MCP must route through the same Core path.
- Any future consumer (Chat, Work, third-party) gets authorization correctness by using the single entry point.
- Testing becomes simpler: one integration test covers all consumers.
- Security audits have one code path to verify instead of four.
