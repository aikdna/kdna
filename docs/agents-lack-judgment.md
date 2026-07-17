# AI Agents Need More Than Tools: Judgment Should Be Portable

> Judgment already exists across the AI stack. KDNA asks when it should become
> an independently identified and loadable asset.

Over the past eighteen months, we have watched agents learn to call APIs, query databases, execute code, and orchestrate workflows. MCP standardized tool access. Function calling became a first-class primitive. Workflow engines made multi-step execution reliable.

We built the hands. We forgot the eyes.

An agent that can do anything but cannot tell the difference between a price objection and a certainty deficit will execute the wrong actions with perfect confidence. An agent that can schedule meetings but cannot distinguish a real decision from social agreement will treat discussion as commitment — and cost you a quarter.

**This is not a capability gap. It is a judgment gap.**

## The Tool Layer Is Saturated

Look at any agent framework today. The feature matrix is converging:

| Layer | Problem Solved | Representative Tech |
|---|---|---|
| **Action** | How does the agent *do* things? | Function calling, MCP, tool use |
| **Memory** | How does the agent *remember* things? | Vector DBs, conversation history, knowledge graphs |
| **Retrieval** | How does the agent *find* things? | RAG, search APIs, semantic retrieval |
| **Workflow** | How does the agent *sequence* things? | LangGraph, CrewAI, state machines |
| **Prompting** | How does the agent *know what to say*? | System prompts, few-shot examples, CoT |

Each layer is competitive, well-funded, and improving rapidly. But notice what is missing from this table:

> **Judgment** — How does the agent *know what kind of situation this is?*

No framework today treats "situation classification" as a first-class concern. We assume that if you give the agent enough context, good prompts, and the right tools, it will figure out the rest.

It will not.

## A Concrete Failure

Consider a meeting summary. A team discusses the Q3 budget. Everyone agrees marketing needs more spend. No specific amount is decided. No owner is assigned.

Here is what a typical agent produces:

> "The team discussed the Q3 budget and agreed marketing needs more investment. Next steps: follow up on budget allocation."

Here is what the agent should have produced:

> **Classification:** UNRESOLVED
> **Missing:** owner, timing, explicit choice
> **Misunderstanding detected:** Social agreement mistaken for commitment (MS-001)
> **Recommended action:** Before execution, assign owner and deadline. Do not treat as decided.

The first output is not wrong. It is *dangerously incomplete*. It turns discussion into the appearance of a decision. Anyone reading the summary will think "marketing budget increase" is a decided item. It is not.

This failure mode — let's call it **false actionization** — is not a bug in the LLM. It is a missing layer in the agent stack. The agent has no concept of "decision state." It has never been told that "everyone agreed" is not the same as "someone owns this with a deadline."

## Why Prompt-Only Embedding May Not Be Enough

You might think: "Just add this to the system prompt."

Prompts can be structured, versioned in Git, tested against fixtures, inspected,
and composed under application-defined rules. A well-engineered prompt system
may be entirely sufficient.

The portability problem appears when judgment must move beyond that one prompt
system. Different applications may use different identifiers, version rules,
authorization models, projection budgets, and evidence formats. Copying the
same text does not by itself prove that the same asset version was authorized
and delivered without semantic loss.

KDNA does not fix this by making the judgment smarter. It supplies a shared
asset and loading contract when an application-specific prompt contract is no
longer enough.

## Why Retrieval Alone Does Not Establish Asset Consumption

You might think: "Just retrieve relevant documents."

RAG can retrieve facts, Policies, rubrics, examples, counterexamples, and
judgment. It is not the wrong tool merely because the content is judgmental.

Retrieval and KDNA make different guarantees. Retrieval selects passages for a
query; KDNA identifies and loads a bounded asset version under integrity,
authorization, and projection rules. A retrieved passage may solve the task.
When exact identity and lifecycle matter, retrieval alone does not prove which
judgment asset was consumed or whether its required boundaries were preserved.

## The Additional Contract: Portable Domain Judgment

Some tasks need **domain judgment**: a structured encoding of how a person,
team, model, or other author classifies situations, detects misunderstandings,
and reasons from principles to action. That judgment may already live in tools,
Memory, documents, Prompt, Skill, Policy, or model behavior.

This is what KDNA (Knowledge DNA) encodes:

- **Axioms** — Fundamental assumptions the agent should start from
- **Ontology** — Key concepts and their boundaries
- **Misunderstandings** — Common errors with correct alternatives and key distinctions
- **Frameworks** — Step-by-step reasoning paths for specific situations
- **Self-checks** — Verification steps before finalizing judgment
- **Scenarios** — Signal patterns that should trigger specific response strategies

KDNA packages a selected judgment system as a `.kdna` asset. It does not replace
the Prompt or knowledge system that may contain equivalent content, and loading
it does not guarantee that a model's behavior will improve. Its distinct value
is protocol-level identity, integrity, authorization, projection, and lifecycle.

## Before and After: The Same Input, Different Trajectory

| Without KDNA | With KDNA |
|---|---|
| "Client says price is too high → offer discount" | "Price objection is a certainty deficit → diagnose which dimension (ROI, comparison, risk, budget cycle)" |
| "Employee won't execute → motivation problem" | "Execution failure → check upstream system conditions (clarity, authority, resources, interference)" |
| "Elderly won't participate → make it more fun" | "Not interested → identify the invisible barrier (fear, burden, dignity threat, accessibility)" |
| "Meeting agreed on budget → schedule implementation" | "Social agreement detected, no operational commitment → flag as UNRESOLVED, assign owner and deadline" |

Notice: KDNA does not change the agent's tools. It changes which tools the agent chooses to use — and whether it uses them at all.

## Benchmark: Does It Actually Work?

We tested this with 30 real and high-fidelity meeting scenarios across four decision states: UNRESOLVED, CONDITIONAL, INTENTIONAL_DEFERRAL, and EXECUTABLE_DECISION.

| Metric | Without KDNA | With KDNA |
|---|---|---|
| State accuracy | 90.0% | **96.7%** |
| False actionization errors | 2 | **0** |
| Full score (classification + missing + misunderstandings + recommendation) | 63.3% | **56.7%** |

The full score is harder because KDNA-loaded agents are more conservative — they correctly flag more missing elements and misunderstandings, which the scoring rubric penalizes if not all identified. But the critical metric is **false actionization**: treating an UNRESOLVED discussion as an EXECUTABLE decision. This dropped from 2 errors to 0.

**In judgment, being conservative is better than being wrong.**

The benchmark summary is historical public narrative evidence. The detailed
benchmark artifact is not part of the current public beta repository.

## The Six Layers, Properly Defined

Here is how KDNA fits into the complete agent stack:

| Carrier or protocol | Primary contract | May carry judgment? |
|---|---|---|
| **Prompt** | Invocation instructions and context | Yes |
| **Skill** | Reusable capability, instructions, references, and tools | Yes |
| **MCP / Tools** | Server, resource, prompt, and tool interaction | Yes |
| **RAG / Memory** | Retrieval and continuity | Yes |
| **KDNA** | Judgment asset identity and compatible loading | Yes — first-class payload responsibility |
| **Workflow / Policy** | Sequencing, governance, and enforcement | Yes |

These are overlapping systems, not mutually exclusive cognitive layers. KDNA
works alongside them when judgment needs its own portable asset contract.

## Why This Matters for Builders

If you are building agent frameworks, consider this: every domain your users care about has expert judgment patterns that currently live only in senior practitioners' heads. Sales directors know which objections mask certainty deficits. Engineering managers know which "execution problems" are actually upstream clarity failures. Product leaders know which feature requests mask real needs.

These patterns may be represented in workflows, documents, prompts, skills, or
models. KDNA offers another representation: a named, bounded judgment asset
that compatible runtimes can inspect and load under a shared contract.

KDNA is a format for extracting those structures, encoding them in machine-verifiable JSON, and loading them into agents as a first-class cognitive layer.

## The Long Game

The agent ecosystem will not stop at tools. The next frontier is not "more capable hands." It is "better discernment."

We are building toward a world where agents do not just execute tasks — they know when *not* to execute. Where they do not just retrieve facts — they know which facts matter for this kind of situation. Where they do not just follow workflows — they know which workflow applies, and whether the preconditions are met.

That world benefits from making structured judgment portable alongside better
models, tools, retrieval, prompts, skills, and workflows.

KDNA is our proposal for that asset contract. We do not claim that it is the
only place judgment can live or that every task needs it. We claim the question
is worth making explicit:

> **What would it take for an agent to not just act correctly, but to correctly decide whether to act at all?**

The answer starts with encoding judgment.

---

*KDNA (Knowledge DNA) is an open format for encoding domain judgment for AI agents. See [github.com/aikdna/kdna](https://github.com/aikdna/kdna) for the specification and reference implementations.*
