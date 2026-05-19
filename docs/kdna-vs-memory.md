# KDNA vs Memory

AI memory systems remember what happened. KDNA interprets what it means.

## The Core Difference

**Memory asks:** What happened before? What does the user prefer? Where did we leave off?

**KDNA asks:** In this domain, what does this pattern of behavior actually mean?

## The Five-Layer Stack

| Layer | Role | Example |
|-------|------|---------|
| Model | Reasoning and generation | GPT, Claude |
| Knowledge | Facts and documents | RAG, databases, web |
| Memory | History and continuity | User history, preferences, session context |
| **KDNA** | **Domain judgment** | **Axioms, misreads, signals, self-checks** |
| Action | Execution | MCP, tools, workflows |

KDNA sits between memory and action. Memory provides context about what happened. KDNA provides judgment about what that context means before the agent acts.

## Why This Matters

Memory without judgment is dangerous. An agent that remembers a customer asked about pricing three times but doesn't know that repeated price questions signal a certainty deficit — will keep offering discounts. An agent that remembers an employee missed deadlines but doesn't know that repeated misses signal an upstream system failure — will keep blaming motivation.

Memory records the signal. KDNA interprets the signal.

## Comparison

| | Memory | KDNA |
|---|--------|------|
| Core question | What happened? | What does it mean in this domain? |
| Stores | Events, preferences, history | Axioms, misreads, signals, self-checks |
| Output | Retrievable context | Loadable judgment structure |
| Value | Continuity, personalization | Professional judgment, misread prevention |
| Risk | Over-memory, privacy | Vague rules, wrong domain application |

## They Work Together

> Memory tells AI what happened. KDNA tells AI what it means. Skills tell AI what to do next.

A customer service agent: memory recalls the customer's complaint history. KDNA judges whether the pattern signals a service failure, an expectation gap, or a risk escalation. Skills execute the appropriate response.

KDNA is not a memory system. It is a **Memory-Compatible Judgment Layer** — it works with any memory system, adding domain interpretation to remembered context.
