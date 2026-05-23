# Getting Started with KDNA

> [中文版](./getting-started.zh.md)

How to install KDNA, create your first domain, and use it with an agent.

## 1. Install the Loader Skill

The `kdna-loader` skill tells your agent how to find and apply KDNA.

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

## 2. Set Up Your KDNA Library

```bash
mkdir -p ~/.agents/Kdna
```

Add domains from the canonical [kdna-registry](https://github.com/aikdna/kdna-registry) or create your own.

## 3. Create Your First Domain

Start from the template:

```bash
cp -r templates/minimal-domain ~/.agents/Kdna/my_domain
```

Edit the two JSON files:

- `KDNA_Core.json` — axioms, ontology, frameworks, causal structure, stances
- `KDNA_Patterns.json` — terminology, banned terms, misunderstandings, self-checks

Fill in the placeholders. Keep it short at first — 2-3 axioms, 2-3 concepts, 2-3 misunderstandings.

## 4. Validate

```bash
node validators/kdna-lint.js ~/.agents/Kdna/my_domain
```

Fix any errors before using the domain.

## 5. Add to the Registry (Optional)

Create or edit `~/.agents/Kdna/registry.json`:

```json
{
  "version": "1.0-rc",
  "root": "~/.agents/Kdna",
  "domains": [
    {
      "id": "my_domain",
      "name": "My Domain",
      "path": "my_domain",
      "status": "local",
      "description": "What this domain covers.",
      "triggers": ["keyword1", "keyword2"]
    }
  ]
}
```

The `triggers` field helps the agent discover which domain to load based on the user's question.

## 6. Use It

When your agent has the `kdna-loader` skill installed and a user asks about your domain, the agent will:

1. Search `~/.agents/Kdna/` for matching domains
2. Load `KDNA_Core.json` and `KDNA_Patterns.json`
3. Load optional files based on the user's task
4. Apply domain axioms, terminology, and self-checks before responding

The user sees a domain-shaped answer — not a summary of KDNA.

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
