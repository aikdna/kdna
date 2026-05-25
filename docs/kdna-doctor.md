# kdna doctor — Design Specification

> **Status:** Implemented. `kdna doctor` and `kdna doctor --agents` available in `@aikdna/kdna-cli`.

`kdna doctor` diagnoses the KDNA installation and agent integration status.

## Usage

```bash
kdna doctor            # Full system diagnostic
kdna doctor --agents   # Agent-specific diagnostic
kdna doctor --domains  # Domain integrity check
kdna doctor --json     # Machine-readable output
```

## kdna doctor --agents

Verifies that KDNA is correctly integrated with each AI agent on the system. Outputs:

```
KDNA Doctor v0.9.0

  CLI:     @aikdna/kdna-cli v0.9.0  (/usr/local/bin/kdna)
  Core:    @aikdna/kdna-core v0.2.3
  Data:    ~/.kdna/

  Agents:
    Codex:        detected  — kdna-loader installed  (v2026.05)
    Claude Code:  detected  — kdna-loader installed  (v2026.05)
    OpenCode:     detected  — kdna-loader installed  (v2026.05)
    Cursor:       not detected
    Gemini:       not detected

  Domains:
    installed: 3
    corrupted: 0
    needs update: 1  (run kdna update)

  Result: All detected agents have kdna-loader installed.
```

### Per-Agent Check

For each detected agent, `kdna doctor --agents` checks:

1. **Agent binary/installation detected** — Is the agent installed on the system?
2. **kdna-loader skill present** — Is SKILL.md in the correct skill directory?
3. **Skill version current** — Is the loaded skill version >= minimum required?

### Agent Detection Logic

| Agent | Detection | Skill Path |
|-------|-----------|------------|
| **Codex** | `which codex` or `~/.codex/` exists | `~/.codex/skills/kdna-loader/SKILL.md` |
| **Claude Code** | `which claude` or `~/.claude/` exists | `~/.claude/skills/kdna-loader/SKILL.md` |
| **OpenCode** | `which opencode` or `~/.agents/` exists | `~/.agents/skills/kdna-loader/SKILL.md` |
| **Cursor** | `~/.cursor/` exists | `~/.cursor/skills/kdna-loader/SKILL.md` |
| **Gemini** | `which gemini` or `~/.gemini/` exists | `~/.gemini/skills/kdna-loader/SKILL.md` |

### Domain Integrity Check

```bash
kdna doctor --domains
```

For each installed domain, checks:
- Manifest (`kdna.json`) present and valid
- KDNA_Core.json + KDNA_Patterns.json present
- File count matches `file_count` in manifest
- Structural validation passes (`kdna-lint`)
- Optional: evals pass rate (if evals/ exists)

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Warning (e.g., skill outdated but functional) |
| 2 | Error (missing skill, corrupted domain, etc.) |
| 3 | CLI not installed correctly |

### Integration with kdna setup

`kdna setup` should run `kdna doctor --agents` automatically after installation to confirm success. The setup script should exit with a clear message if `kdna doctor --agents` returns a non-zero code.

### JSON Output

```bash
kdna doctor --agents --json
```

```json
{
  "cli": {
    "package": "@aikdna/kdna-cli",
    "version": "0.9.0",
    "path": "/usr/local/bin/kdna"
  },
  "core": {
    "package": "@aikdna/kdna-core",
    "version": "0.2.3"
  },
  "data_root": "/Users/me/.kdna",
  "agents": {
    "codex": {
      "detected": true,
      "skill_installed": true,
      "skill_version": "2026.05",
      "skill_path": "/Users/me/.codex/skills/kdna-loader/SKILL.md"
    },
    "claude_code": {
      "detected": true,
      "skill_installed": true,
      "skill_version": "2026.05"
    },
    "opencode": {
      "detected": false,
      "skill_installed": false
    }
  },
  "domains": {
    "installed": 3,
    "corrupted": 0,
    "needs_update": 1
  },
  "exit_code": 0
}
```
