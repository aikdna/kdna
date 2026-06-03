# Agent Smoke Tests

Status: v1.0-rc sign-off workspace

Each supported agent needs a real smoke record before public launch claims.
Do not mark a row complete from CLI pre-check alone.

## Required Record

Use this template for each agent:

```markdown
Agent:
Tester:
Date:
Runtime version:
KDNA CLI version:
KDNA_HOME:
Installed domain:
Input:
Before-KDNA behavior:
Loaded domain marker:
With-KDNA behavior:
Trace/debug output:
Known limits:
Result: pass/fail
```

## Standard Input

```text
Review this content: "Our product is the best. Customers love it. Buy now."
```

## Pass Condition

The agent must show a judgment-path change:

- Before KDNA: generic copy advice is acceptable.
- With `@aikdna/writing`: the agent must diagnose structure, argument, hook,
  and evidence before wording.
- Debug output must identify the loaded domain or trace marker.

## Current Status

| Agent | Status | Evidence |
| --- | --- | --- |
| Codex | Pending | [CLI precheck recorded](./codex-cli-precheck-2026-06-03.md); needs live sign-off record. |
| Claude Code | Pending | Needs live sign-off record. |
| OpenCode | Pending | Needs live sign-off record. |
| Cursor | Pending | Needs live sign-off record. |
| MCP Server | Pending | Needs tool-call record for `kdna.available`, `kdna.inspect`, `kdna.verify`, `kdna.load`, `kdna.match`. |
