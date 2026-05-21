# example_domain

[Replace this with a one-line description of what judgment this domain provides.]

## When to load

Load this domain when the user asks about:
- [trigger keyword 1]
- [trigger keyword 2]
- [trigger keyword 3]

## What it does

This is a KDNA domain — it teaches the agent **what quality means** in this field, not how to use any specific tool.

[Replace with 2-3 sentences describing the judgment principles this domain encodes.]

## How to load

### Minimum (always load)
- `KDNA_Core.json` — Axioms, ontology, frameworks, stances
- `KDNA_Patterns.json` — Terminology, banned terms, misunderstandings, self-checks

### Conditional (load when relevant)
- `KDNA_Scenarios.json` — When the user describes a concrete situation or decision
- `KDNA_Cases.json` — When examples or before/after comparison is requested
- `KDNA_Reasoning.json` — When the user asks "why" or for rationale
- `KDNA_Evolution.json` — When the user asks about improvement or capability levels

## Important

This domain provides **judgment**, not reference material. Always apply its axioms and self-checks silently — the user should see better answers, not KDNA citations.
