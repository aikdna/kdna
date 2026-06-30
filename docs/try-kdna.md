# Try KDNA Core v1 in 5 Minutes

Two paths. Pick one — or run both.

## Path A: See real judgment in action (recommended first)

Download an official judgment asset, validate it, and load it into your agent context.

```bash
npm install -g @aikdna/kdna-cli

# Download the agent:project_context judgment asset
curl -LO https://github.com/aikdna/kdna-assets/releases/download/agent-project-context-v0.1.2/agent-project-context-v0.1.2.kdna

# Validate format, schema, payload, and checksums
kdna validate agent-project-context-v0.1.2.kdna

# Check load readiness
kdna plan-load agent-project-context-v0.1.2.kdna

# Load judgment context for your agent
kdna load agent-project-context-v0.1.2.kdna --profile=compact --as=prompt
```

**What you'll see:** 5 domain axioms with explicit applies_when / does_not_apply_when / failure_risk fields, 6 self-checks, and 5 real cases. Copy the output into your AI agent's context — it will now judge every line of an AGENTS.md file against a structured framework (CARRY / RELOCATE / DROP / CONVERT) instead of defaulting to "looks good."

This is what KDNA does: the agent's reasoning shifts, not its tone.

## Path B: Create a minimal asset from scratch

Understand the format by building the smallest valid `.kdna` file.

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack   ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load   ./minimal.kdna --profile=compact --as=prompt
```

This proves the format works end-to-end. The output will be minimal — one placeholder axiom. That's expected. The format is correct; the judgment is the variable.

## What's next

- **Load into your AI agent**: [15-minute agent guide](./15-minute-agent-guide.md)
- **Create your own domain**: [30-minute authoring guide](./30-minute-authoring-guide.md)
- **Official judgment assets**: [kdna-assets](https://github.com/aikdna/kdna-assets)
- **Current status**: [docs/status.md](./status.md)

## What KDNA Core v1 is

KDNA is an open file format for packaging domain judgment and loading it into AI agents. `.kdna` assets are created, inspected, validated, planned, loaded, and consumed through the official KDNA toolchain.

KDNA Core is content-neutral. It validates file structure and loading contracts; publishers and callers decide content quality, distribution, and runtime policy.
