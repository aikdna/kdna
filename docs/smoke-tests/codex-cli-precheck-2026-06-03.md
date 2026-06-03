# Codex CLI Precheck — 2026-06-03

This is a CLI precheck from the Codex environment. It is not a completed agent
smoke sign-off because it does not include a before/after agent judgment trace.

## Environment

- Agent surface: Codex
- Date: 2026-06-03
- KDNA CLI: `kdna v0.19.3`
- Installed domain checked: `@aikdna/writing`

## Commands

```bash
kdna available --json
kdna load @aikdna/writing --as=json
kdna verify @aikdna/writing --json
```

## Result

| Check | Result | Notes |
| --- | --- | --- |
| `kdna available --json` | Pass | Official domains are visible in the local runtime. |
| `kdna load @aikdna/writing --as=json` | Pass | Runtime can load the installed signed asset and emit machine JSON. |
| `kdna verify @aikdna/writing --json` | Fail, exit 4 | Structure and trust pass, but judgment quality fails. |

The installed `@aikdna/writing` asset reports 10 eval case files and fails these
judgment checks:

- README boundary declaration missing.
- `quality_badge: "tested"` requires authoring provenance.

## Status

Do not mark Codex smoke as complete from this precheck. The next valid smoke
record must include:

- A republished signed asset if source eval changes are intended to be part of
  the installable asset.
- Before-KDNA and with-KDNA output comparison.
- Loaded domain marker or trace/debug proof from the agent runtime.
- A passing or explicitly scoped `kdna verify --json` result.
