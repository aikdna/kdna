# KDNA Agent Integrations

## Current supported technical path

All compatible Hosts can start from the same explicit `.kdna` file:

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./asset.kdna --runtime
kdna plan-load ./asset.kdna --json
kdna load ./asset.kdna --profile=compact --as=json
```

The Host receives a Runtime Capsule. This proves technical delivery only; it
does not prove that the model followed the judgment or that the result is
better.

## Agent adapters

`kdna-skills` contains Skill and MCP adapters for Codex, Claude Code, OpenCode,
Cursor, and compatible Hosts. The repository mission is retained, but the
loader Skill is currently **Unassessed** for release. The previous global
auto-discovery and silent-loading model is not the current product contract.

A conforming adapter must start from an explicit user-selected file or an exact
Host-approved workspace/application/session attachment. It must use
`inspect → plan-load → load`, expose active identity and scope through Host
status, and never infer authority from a file's presence.

Until that adapter flow is recertified, use the explicit CLI/Core path above or
integrate the same calls directly in the Host. Do not rely on `kdna setup` as
proof that an Agent integration is correct.

See [Agent Adapter Behavior](./loader-behavior.md) for the target boundary.
