# KDNA 5-Minute Developer Guide

Connect KDNA domains to your AI agent so it judges better. One path, five minutes.

## What You Will Do

1. Install the KDNA CLI
2. Install a domain (writing, code review, or your choice)
3. Connect it to your agent
4. Verify: ask the same question twice — with and without KDNA — and see the difference

---

## Step 1: Install CLI + Setup

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

`kdna setup` detects your AI agent (OpenCode, Codex, Claude Code, Cursor, or Gemini), installs the `kdna-loader` skill, and creates the data directory. No domains are installed yet.

Verify:

```bash
kdna version  # → kdna v0.8.0
kdna list     # → "No KDNA domains installed."
```

---

## Step 2: Choose and Install a Domain

Browse available domains:

```bash
kdna list --available
```

Pick one and install:

```bash
# Writing — diagnose whether content has a real argument, hook, and evidence
kdna install writing

# Code Review — behavior-first review, anti-rubber-stamp principles
kdna install code_review

# Agent Safety — gate irreversible actions before tools run
kdna install agent_safety

# Or search by keyword
kdna search "security"
```

Verify installation:

```bash
kdna list

# Output:
# 1 installed KDNA domain(s):
#   @aikdna/writing  v0.7.3  [tested]
#     Diagnose whether content has a real argument...
#     applies when: 4 situations declared
#     does NOT apply when: 2 situations declared

kdna verify @aikdna/writing  # structure + trust + judgment scoring
```

---

## Step 3: Connect to Your Agent

The `kdna-loader` skill (installed by `kdna setup`) teaches your agent how to discover and use KDNA domains. No configuration is needed.

### How it works (under the hood)

When you start a conversation, the `kdna-loader` skill:
1. Calls `kdna list --json` to discover installed domains
2. Reads each domain's `applies_when` and `does_not_apply_when` fields
3. If a domain fits your task, loads the domain to inject its axioms, stances, misunderstandings, and self-checks into the agent's context

You don't need to think about any of this. The agent does it silently.

---

## Step 4: Verify — See the Difference

The fastest way to confirm KDNA is working is to ask your agent the same question twice:

### Without KDNA

Ask your agent: "Review this writing: 'Our product is the best in the market. Customers love it. Get yours today.'"

The agent will produce generic feedback — probably about clarity, conciseness, or "make it more specific."

### With KDNA (writing domain loaded)

Ask the same question. The `kdna-loader` detects "writing" → "review" → matches `@aikdna/writing`. The agent now judges against domain axioms:

- **Argument structure**: Is there a real argument, or just claims?
- **Cognitive hook**: Does it give the reader a reason to care?
- **Evidence density**: Are claims backed by evidence?
- **Banned terms**: "best" is banned (replace with specific claim), "love it" is banned (replace with evidence of satisfaction)

The feedback changes from "make it more specific" to structurally diagnosing *why* the writing doesn't work.

---

## Step 5: Programmatic Usage (SDK)

For custom agent runtimes, use the KDNA SDK:

```javascript
const { loadDomain, classifyInput, formatContext } = require('@aikdna/kdna-core');

// Load a domain
const domain = loadDomain('/path/to/kdna-agent_safety');

// Check if the domain's applies_when matches your task
const signals = classifyInput("The user wants to delete all production databases", domain);
if (signals.fit) {
  const context = formatContext(domain, 'prompt');
  // Inject context into your agent's system prompt
}
```

---

## Step 6: Author Your Own Domain

Package your own expertise as a KDNA domain:

```bash
kdna dev scaffold my_expertise
# Creates: my_expertise/
#   KDNA_Core.json    — your axioms, concepts, frameworks
#   KDNA_Patterns.json — terminology, misunderstandings, self-checks
#   kdna.json          — metadata (name, version, license)
```

This is a non-canonical dev source workspace. Edit the files for experimentation, then use KDNA Studio or a Studio-compatible compiler for Human Lock, compile, and export.

```bash
kdna dev validate my_expertise       # structural check for dev source
kdna publish --check my_expertise    # content quality gate
kdna-studio export my_expertise --out ./dist/my_expertise.kdna --sign
kdna publish ./dist/my_expertise.kdna # publish existing Studio-built asset
kdna install ./dist/my_expertise.kdna # install local asset for testing
```

---

## Troubleshooting

### "No KDNA domains installed"

Run `kdna install <name>` to install an asset from the registry, or `kdna install ./file.kdna` for a local asset. Source directories are dev-only and cannot be installed directly.

### "kdna-loader skill not found"

Run `kdna setup` again. This installs the skill into all detected agent directories. If your agent directory is custom, manually copy the skill:

```bash
cp -r ~/.kdna/skills/kdna-loader ~/your-agent-dir/skills/kdna-loader
```

### "My agent doesn't seem to use KDNA"

Check that the `kdna-loader` skill is installed:

```bash
ls ~/.claude/skills/kdna-loader/SKILL.md   # Claude Code
ls ~/.agents/skills/kdna-loader/SKILL.md   # OpenCode
ls ~/.codex/skills/kdna-loader/SKILL.md    # Codex
```

If the file exists but KDNA isn't loading, the task might not match any domain's `applies_when` fields. Try:

```bash
kdna select "your task description"
```

This shows which domains would be considered and why.

### "Domain not found in registry"

Ensure your network connection is working. The CLI caches the registry at `~/.kdna/registry/domains.json`. To force a refresh:

```bash
kdna registry refresh
```

---

## Next Steps

- [Browse all available domains](https://aikdna.com/domains)
- [Learn to author KDNA domains](authoring-guide.md)
- [Enterprise deployment guide](enterprise.md)
- [KDNA Specification](../SPEC.md)
