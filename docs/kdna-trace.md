# KDNA Agent Call Logging (kdna trace)

## Overview

`kdna trace` records which KDNA domains were loaded, by which agent, for which task, and what the outcome was. This enables debugging, enterprise audit compliance, and judgment governance.

## kdna trace

```bash
kdna trace [--agent <name>] [--domain <name>] [--since <date>] [--format json|table]
```

### Output (table)

```
KDNA Trace — Last 7 days
┌─────────────────────┬────────────────┬────────────────────────────┬──────────┬──────────┐
│ Timestamp           │ Agent          │ Task                       │ Domain   │ Result   │
├─────────────────────┼────────────────┼────────────────────────────┼──────────┼──────────┤
│ 2026-05-23 14:32:01 │ Claude Code    │ "review this PR"           │ code_rev │ pass     │
│ 2026-05-23 14:15:44 │ OpenCode       │ "improve this blog post"   │ writing  │ pass     │
│ 2026-05-23 13:58:12 │ Codex          │ "was that a decision?"     │ decision │ pass     │
│ 2026-05-23 11:02:33 │ Claude Code    │ "format this as JSON"      │ (none)   │ skipped  │
│ 2026-05-22 16:45:00 │ OpenCode       │ "check this code for bugs" │ code_rev │ fail     │
└─────────────────────┴────────────────┴────────────────────────────┴──────────┴──────────┘
```

### JSON Output

```json
{
  "period": { "since": "2026-05-16", "until": "2026-05-23" },
  "entries": [
    {
      "id": "trace_abc123",
      "timestamp": "2026-05-23T14:32:01Z",
      "agent": "claude_code",
      "agent_version": "1.0.0",
      "task_summary": "review this PR for security issues",
      "task_category": "code_review",
      "kdna_applied": true,
      "discovery": {
        "available_count": 5,
        "candidates_checked": 2,
        "domains_disqualified": ["@aikdna/writing", "@aikdna/agent_safety"],
        "disqualify_reasons": {
          "@aikdna/writing": "does_not_apply_when matched: not a writing task",
          "@aikdna/agent_safety": "no irreversible action detected"
        }
      },
      "loaded": {
        "domain": "@aikdna/code_review",
        "version": "0.7.5",
        "load_profile": "full",
        "axioms_triggered": ["behavior_first", "cite_failure_mode", "anti_rubber_stamp"],
        "frameworks_applied": ["classify_comment_type"],
        "self_checks_passed": 4,
        "self_checks_total": 4
      },
      "postvalidate": {
        "run": true,
        "result": "pass",
        "score": 8.5
      }
    }
  ]
}
```

## What Gets Logged

| Field | Description | When Logged |
|-------|-------------|-------------|
| `timestamp` | When the call happened | Always |
| `agent` | Which agent made the call | Always |
| `agent_version` | Agent version | Always |
| `task_summary` | One-line description of user's request | Always |
| `task_category` | Classified task type | Always |
| `kdna_applied` | Whether any KDNA was loaded | Always |
| `available_count` | How many domains installed | When KDNA considered |
| `candidates_checked` | How many domains evaluated for fit | When KDNA considered |
| `match_result` | Which domains matched/dropped and why | When match ran |
| `loaded_domain` | Which domain was loaded (if any) | When domain loaded |
| `axioms_triggered` | Which axioms applied to this task | When domain loaded |
| `self_checks` | Pass/fail for each self-check | When domain loaded |
| `postvalidate_result` | Score after judgment applied | When postvalidate ran |

## Log Storage

Logs are stored in `~/.kdna/traces/` as JSON Lines:

```
~/.kdna/
  traces/
    2026-05-23.jsonl
    2026-05-22.jsonl
    ...
```

One file per day. Each line is one JSON record. Append-only. Rotated automatically (keep last 90 days by default).

## Privacy

- `task_summary` is hashed by default (`sha256(salt + task_summary)`)
- Full task text is NOT stored — only the hashed summary for deduplication
- Opt-in: `kdna trace --store-full-text` to store task text for debugging
- Enterprise mode: `KDNA_TRACE_POLICY=full` environment variable

## Enterprise Audit

For enterprise deployments:

```bash
kdna trace --export audit-report.json --since 2026-01-01

# Output:
# - All domain loads
# - All match/drop decisions
# - All postvalidate results
# - License verification events
# - Signature verification events
```

This enables compliance reporting: which domains were loaded, were licenses valid, were signatures verified.

## Integration with kdna history

`kdna history` is a human-friendly wrapper:

```bash
kdna history                    # Last 20 entries
kdna history --domain writing   # Writing domain usage
kdna history --agent codex      # Codex-specific entries
kdna history --stats            # Usage statistics

# Stats output:
# Total KDNA loads: 47
# Domain breakdown:
#   writing: 23 (48.9%)
#   code_review: 15 (31.9%)
#   decision_state: 9 (19.1%)
# Skip rate: 12% (tasks where KDNA was considered but not loaded)
# Average load time: 0.3s
```

## CLI Commands

| Command | Purpose |
|---------|---------|
| `kdna trace` | View recent trace entries |
| `kdna trace --json` | Machine-readable trace output |
| `kdna trace --export <file>` | Export full trace to file |
| `kdna history` | Human-readable recent history |
| `kdna history --stats` | Usage statistics |
| `kdna trace --clear` | Clear trace logs |
| `kdna trace --policy full\|hashed\|off` | Set privacy policy |
