# AI Agents Don't Just Need Tools. They Need Domain Judgment.

MCP connects tools. Skills package capability. RAG retrieves knowledge.

**KDNA packages human-locked domain judgment.**

---

## The Missing Layer

AI agents are becoming remarkably capable. They can search, write code, call APIs, execute workflows, and maintain long-term memory. The agent stack has solved *action*.

But a deeper question remains:

> When an agent enters a domain, **what tells it how to judge?**

Not what to do. Not what facts to retrieve. Not what template to fill.

What to *notice*. What to *question*. What to *reject*. What counts as *done right* in this specific field.

This is domain judgment — and it has no standard format. Until now.

## Judgment Is Scattered

Today, domain judgment already exists. It appears in:

- Expert habits that are never written down
- Prompt fragments that degrade with each edit
- Style guides that mix principles with background context
- Checklists that capture surface rules but not diagnostic reasoning
- Senior reviewers who catch subtle failures that no document describes

When an agent makes a mistake — suggesting a discount when the real problem is uncertainty, polishing language when the real problem is a missing argument, approving code without checking behavior — it's hard to inspect which judgment rule was missing, outdated, or ignored.

Judgment exists. But it's scattered, implicit, and untestable.

## What KDNA Does

A KDNA domain is 2–6 JSON files that encode:

- **Axioms** — the irreducible judgment principles that change how an agent interprets situations
- **Banned terms** — words and phrases that mislead judgment
- **Misunderstandings** — real errors that beginners and models consistently make
- **Self-checks** — yes/no questions the agent asks itself before responding
- **Scenarios** — situation signals that should change the agent's strategy

The key insight: **KDNA does not tell the agent what to say. It tells the agent how to diagnose what kind of situation this is.**

## Same Input. Different Judgment Path.

```
User: "My team keeps missing deadlines. They need more motivation."

Without KDNA:
  → Suggests incentive programs, rewards, performance improvement plans.

With leadership_decisions.kdna:
  → Classifies as a possible decision void (not motivation failure).
  → Checks: Is there a named owner? A deadline? Clear criteria?
  → Diagnoses: No one was ever named as responsible. 
    This is a decision problem disguised as an execution problem.
```

The agent didn't get better at giving advice. It got better at *diagnosing what kind of problem this is*.

## Human Lock: Why KDNA Is Not an AI Generator

AI can propose judgment candidates. AI can interview experts. AI can run comparison tests. But **AI cannot confirm judgment**.

Every judgment card entering a compiled KDNA domain must pass Human Lock — a deliberate, per-card confirmation by the human author. There is no "Generate Domain" button. Draft cards are silently excluded from compiled output. Only locked cards enter the KDNA.

## Governance, Not Disclaimers

Because KDNA influences agent judgment — and judgment influences behavior — the ecosystem is designed around governance.

Every KDNA domain declares: risk level (R0–R3), intended use, out-of-scope boundaries, known limitations, and author responsibility. High-risk domains require expert review. R3 domains are not permitted in the public registry without special review.

## The Ecosystem

| Layer | Role |
|-------|------|
| **KDNA Protocol** | Open standard for domain judgment assets |
| **kdna-cli** | Install, validate, verify, pack, load |
| **KDNA Studio Core** | Open-source authoring kernel |
| **Registry** | Trusted distribution with signatures and provenance |

## Start Small

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
kdna compare @aikdna/writing --input "help me improve this post"
```

---

AIKDNA builds the KDNA Protocol — an open ecosystem for human-locked domain judgment. [aikdna.com](https://aikdna.com)
