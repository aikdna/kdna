# Getting Started with KDNA

> [中文版](./getting-started.zh.md)

How to install KDNA, create your first domain, and use it with an agent.

## 1. Install the CLI

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

## 2. Install a Domain

```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
```

Installed domains live in `~/.kdna/` (or `$KDNA_HOME` if set).

## 3. Create Your First Domain

From the CLI:

```bash
kdna dev scaffold my_domain
```

Or start from the minimal template:

```bash
cp -r templates/minimal-domain ~/.kdna/my_domain
```

Edit the two JSON files:

- `KDNA_Core.json` — axioms, ontology, frameworks, causal structure, stances
- `KDNA_Patterns.json` — terminology, banned terms, misunderstandings, self-checks

Fill in the placeholders. Keep it short at first — 2-3 axioms, 2-3 concepts, 2-3 misunderstandings.

## 4. Validate

```bash
kdna dev validate ~/.kdna/my_domain
```

Fix any errors before using the domain.

## 5. Use It with an Agent

Install the `kdna-loader` skill for your agent:

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

When your agent has the loader skill and a domain is installed, the agent will discover and apply KDNA judgment automatically.

## 6. Share (Optional)

Publish your domain to the [kdna-registry](https://github.com/aikdna/kdna-registry) so others can `kdna install` it.

## 7. When to Expand

Start with Core + Patterns. Use the domain for a while. Then add files when:

| Add | When |
|---|---|
| `KDNA_Scenarios.json` | You notice the agent misclassifies situations |
| `KDNA_Cases.json` | You need reusable examples |
| `KDNA_Reasoning.json` | Users frequently ask "why" questions |
| `KDNA_Evolution.json` | You need to track skill progression |

**Do not write all six files at once.** Let usage reveal what's missing.

## What KDNA Does Not Do

KDNA is a judgment layer, not:
- A prompt library (it doesn't store wording templates)
- A knowledge base (it doesn't store facts or documents)
- A tool API (it doesn't execute actions)
- A retrieval system (it doesn't search external data)
- An operating manual (it doesn't describe procedures)

It sits between your agent and its task, shaping how the agent thinks before it acts.
