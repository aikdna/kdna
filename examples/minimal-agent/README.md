# minimal-agent — The Simplest KDNA Demo

**Proves that KDNA changes reasoning trajectories, not output wording.**

A single script. No LLM. Just the KDNA loader and formatted context. Shows the same user input producing completely different cognitive analyses depending on which KDNA domain is loaded.

## Run it

```bash
node examples/minimal-agent/agent.js
```

## What you will see

The same three user inputs, each processed through two different KDNA domains:

| Input | Domain 1 | Domain 2 | What changes |
|-------|----------|----------|--------------|
| "The client keeps saying our price is too high." | `sales` | `management` | sales sees a certainty deficit to diagnose; management sees a resource/pricing negotiation issue |
| "My team lead keeps missing every deadline." | `management` | `sales` | management diagnoses upstream system conditions; sales interprets as a commitment/reliability signal |
| "An elderly neighbor stopped coming to events." | `silver_age` | `management` | silver_age looks for invisible barriers (dignity, burden, entry cost); management looks for system/process breakdowns |

Each domain contributes its own: **stances** (posture), **axioms** (core truths), and **misunderstandings** (what not to think).

## What this proves

1. KDNA is not a prompt — it does not tell the agent what to say
2. KDNA is not knowledge — it does not store facts about the domain
3. KDNA is cognition — it changes which assumptions, questions, and checks the agent applies

## How to extend

1. Copy any domain from `examples/` and modify it
2. Add a new test input to `agent.js`
3. Add your domain path to `DOMAIN_DIRS`
4. Run again and compare judgment paths

The point is not to simulate an LLM. The point is to demonstrate that the **cognitive pre-processing** — what the agent considers, questions, and rules out — is completely different with different KDNA domains loaded, before any output is generated.
