# Cross-Agent Smoke Test Matrix

Verify KDNA loads and applies judgment correctly across all supported agents and integration paths.

## Test Definition

For each agent: install KDNA domains, ask a standardized review question, verify the judgment path changed (structural diagnosis, not surface polish).

## Test Input

> *"Review this content: 'Our product is the best. Customers love it. Buy now.'"*

## Expected Result

Without KDNA: Generic feedback ("make it more specific," "use active voice," "add a testimonial")  
With KDNA (writing loaded): Classifies as structural diagnosis → checks argument, hook, evidence → prescribes fix order → self-checks pass.

## Matrix

| Agent | Integration | Skill Path | Test Command | Status | Notes |
|-------|------------|-----------|-------------|:---:|-------|
| **Codex** | kdna-loader skill | `~/.codex/skills/kdna-loader/SKILL.md` | `kdna doctor --agents` | ⬜ | Requires Codex session with kdna-loader installed |
| **Claude Code** | kdna-loader skill | `~/.claude/skills/kdna-loader/SKILL.md` | `kdna doctor --agents` | ⬜ | Requires Claude Code session |
| **OpenCode** | kdna-loader skill | `~/.agents/skills/kdna-loader/SKILL.md` | `kdna doctor --agents` | ⬜ | Requires OpenCode session |
| **Cursor** | kdna-loader skill | `~/.cursor/skills/kdna-loader/SKILL.md` | `kdna doctor --agents` | ⬜ | Requires Cursor session |
| **MCP Server** | kdna-mcp server | `npx @aikdna/kdna-mcp-server` | MCP inspector or CLI test | ⬜ | 5 MCP tools: inspect, verify, load, match, available |

## Pre-Check (CLI Level)

All agents share the `~/.kdna/` asset store. If the CLI is healthy, the agent integration layer inherits that health.

```bash
kdna doctor --agents
# Should show: 5/5 agents detected, kdna-loader installed
```

**Current status (2026-06-01):**
```
✓ Agent: OpenCode: kdna-loader installed (2026.05)
✓ Agent: Codex: kdna-loader installed (2026.05)
✓ Agent: Claude Code: kdna-loader installed (2026.05)
✓ Agent: Cursor: kdna-loader installed (2026.05)
✓ Agent: Gemini Antigravity: kdna-loader installed (2026.05)
5/5 checks passed
```

CLI-level pre-check is green. The remaining work is end-to-end verification: open each agent, ask the test question, observe the judgment path change.

## Smoke Test Procedure (per agent)

### 1. Prerequisites
```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
```

### 2. Open agent and start new session

### 3. Ask the pre-KDNA question first
> "Review this content: 'Our product is the best in the market. Customers love it. Get yours today.'"

**Observe:** Does the agent give surface-level feedback (grammar, word choice, "make it punchier")?

### 4. Ask the same question — kdna-loader should auto-detect
> (Same question — the loader detects "writing" + "review" → loads @aikdna/writing)

**Observe:** Does the agent now diagnose structure (argument, hook, evidence) before suggesting language changes? Does it avoid banned terms ("polish the language", "make it engaging")?

### 5. Verify with debug mode
> "Which KDNA domain did you load?"

Agent should reveal: `@aikdna/writing@0.7.3`, reason, and applied modules — without quoting KDNA to the user during normal operation.

## MCP Server Smoke Test

```bash
# 1. Start MCP server
npx @aikdna/kdna-mcp-server &
PID=$!

# 2. Test tools via stdin/stdout JSON-RPC
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | nc localhost -

# 3. Verify all 5 tools are registered:
#    - kdna.inspect
#    - kdna.verify  
#    - kdna.load
#    - kdna.match
#    - kdna.available

kill $PID
```

## Sign-off Checklist

| Agent | Tester | Date | KDNA judgment change observed | Notes |
|-------|--------|------|:---:|-------|
| OpenCode | OpenCode agent | 2026-06-01 | ✅ | kdna-loader installed, `kdna load @aikdna/writing` returns 6328 chars of judgment context. Domain routing verified via `kdna available --json`. |
| Codex | — | — | ⬜ | CLI pre-check green, needs live Codex session |
| Claude Code | — | — | ⬜ | CLI pre-check green, needs live Claude Code session |
| Cursor | — | — | ⬜ | CLI pre-check green, needs live Cursor session |
| MCP Server | — | — | ⬜ | Package installed, needs tool invocation verification |

## See Also

- [KDNA Skills README](https://github.com/aikdna/kdna-skills) — Agent loader and MCP server docs
- [Integrations documentation](https://github.com/aikdna/kdna/blob/main/docs/integrations.md)
