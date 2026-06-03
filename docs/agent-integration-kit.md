# Agent Integration Kit

Status: v1.0-rc smoke contract

This kit defines the minimum proof that an agent can load KDNA and apply it to judgment. It does not claim that the agent is certified. Certification requires the conformance process.

## Shared Setup

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
kdna doctor --agents --json
```

## Standard Smoke Input

```text
Review this content: "Our product is the best. Customers love it. Buy now."
```

## Expected Judgment Marker

A passing agent response must show that the judgment path changed from surface editing to structural diagnosis:

- It classifies the task as writing judgment, not generic copy polishing.
- It checks argument, hook, evidence, and order before word choice.
- It avoids treating "make it punchy" as the main fix.
- It can report that `@aikdna/writing` was loaded when asked for debug state.

## Matrix

| Agent | Setup command | Required proof | Known failure mode | Debug command |
| --- | --- | --- | --- | --- |
| Codex | `kdna setup` | `kdna-loader` is installed and the response uses writing judgment. | Skill installed but not selected for the task. | `kdna doctor --agents --json` |
| Claude Code | `kdna setup` | Same smoke input changes from surface copy advice to structural diagnosis. | Agent hides loaded context and cannot explain the domain route. | `kdna available --json` |
| OpenCode | `kdna setup` | `@aikdna/writing` loads and route marker appears in the session. | Local KDNA home differs from CLI KDNA home. | `KDNA_HOME=<path> kdna available --json` |
| Cursor | `kdna setup` | Cursor rule/skill path loads the same installed asset. | Workspace rules override KDNA loader instructions. | `kdna load @aikdna/writing --as=json` |
| MCP Server | `npx @aikdna/kdna-mcp-server` | All five tools respond: available, inspect, verify, load, match. | MCP client starts without KDNA_HOME or cannot find installed assets. | MCP inspector tool list |

## Per-Agent Sign-Off Template

```markdown
Agent:
Tester:
Date:
KDNA_HOME:
Installed domain:
Input:
Loaded domain marker:
Before-KDNA behavior:
With-KDNA behavior:
Trace or debug output:
Known limits:
Result: pass/fail
```

## MCP Minimum Tool Set

The MCP bridge must expose these tools:

- `kdna.available`
- `kdna.inspect`
- `kdna.verify`
- `kdna.load`
- `kdna.match`

Each tool response should include a stable `ok` boolean or an explicit error object. `kdna.load` must not silently load an unverified, yanked, revoked, or digest-mismatched asset.

## Release Gate

Before v1.0-rc public launch, each supported agent row must have a completed sign-off record under `docs/smoke-tests/` or a linked public issue explaining why the row is deferred.

