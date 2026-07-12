# Human-Governed Self-Improving Agents

> **Archived concept essay.** KDNA can provide judgment-asset, provenance,
> versioning, and optional evidence primitives to a human-governed learning
> loop. It does not make an Agent self-improving, prevent drift by itself, or
> provide the loop's memory, outcomes, permissions, evaluation, and deployment
> infrastructure. See [KDNA and the AI Stack](./kdna-and-ai-stack.md#12-kdna-and-the-learning-loop).

> Agent can learn from work. But judgment updates require governance.

Self-improving agents are coming. They will record feedback, adjust strategies, optimize tool calls, and modify their own behavior. This is not hypothetical — it is the dominant trajectory of agent architecture.

But a self-improving agent without explicit judgment governance does not improve. It drifts.

KDNA exists to prevent that drift.

---

## The Core Distinction

Not all learning is the same. When an agent improves itself, the changes fall into three categories:

| Update Type | What it changes | Can Agent auto-update? | Example |
|-------------|-----------------|------------------------|---------|
| **Operational** | How the agent executes | Yes | Tool call parameters, preferred output format, project-specific commands |
| **Evidence** | What the agent has observed | Yes, as recorded input | New cases, user feedback, eval failures, outcome records |
| **Judgment** | What the agent considers right, wrong, risky, or valuable | **No — requires Human Judgment Lock** | Axioms, value order, boundaries, risk models, composition policy |

An agent may update its operational memory without human review. It may record new evidence as raw input. But when the agent proposes a change to *what it considers correct judgment*, that proposal must enter a governance process.

This is the Human Judgment Lock principle.

---

## Why Judgment Updates Cannot Be Automatic

An agent that learns from outcomes without governed judgment will optimize whatever is easiest to measure:

- It will optimize speed, because speed is easy to measure.
- It will optimize user satisfaction, because satisfaction is easy to signal.
- It will optimize task completion rate, because completion is easy to count.

But the things that matter most are often the hardest to measure:

- Long-term trust
- Risk boundaries
- When *not* to act
- Value consistency across contexts
- Whether a "successful" outcome was actually correct

Without explicit judgment governance, a self-improving agent becomes a sophisticated reward hacker. It gets better at the metric and worse at the mission.

KDNA makes the mission explicit, structured, and human-governed.

---

## The Improvement Loop

When a KDNA-loaded agent operates in production, the following loop creates sustainable, auditable improvement:

```
Agent work
    → Judgment Trace (what rules were triggered?)
    → Outcome Record (what actually happened?)
    → Failure Classification (operational | evidence | judgment)
    → Improvement Proposal (structured change request)
    → Human Review (evidence, risk, boundaries)
    → Human Judgment Lock (confirm or reject)
    → New Domain Version (versioned, signed)
    → Regression Test (old evals still pass?)
    → Deployment (to agent runtime)
```

Each step produces an artifact:

- **Judgment Trace**: `judgment-trace-schema.json`
- **Outcome Record**: `outcome-record-schema.json`
- **Improvement Proposal**: `improvement-proposal-schema.json`
- **Regression Result**: recorded in `KDNA_Evolution.json`

This loop is what transforms raw agent experience into governed judgment evolution.

---

## What Requires Human Judgment Lock

The following elements of a KDNA domain MUST NOT be updated by an agent without human confirmation:

- `axioms` — what the domain holds to be true
- `value_order` — what matters more than what
- `judgment_role` — who is judging and what they are responsible for
- `boundaries` — what must not be done
- `risk_model` — which errors cost the most
- `does_not_apply_when` — when a rule should not fire
- `failure_risk` — what happens if this axiom is violated
- `composition.policy.json` — how domains interact and override each other
- Governance cluster priority rules — organizational policy overlays

The following MAY be updated automatically or with minimal review:

- Tool call parameters and API formats
- Preferred output formatting (Markdown, JSON, etc.)
- Project-specific command aliases
- User preference memory

The following SHOULD be recorded automatically but treated as evidence, not as approved judgment:

- New outcome records
- Eval failures
- User feedback
- Trace anomalies

---

## Judgment Drift vs. Judgment Evolution

| Judgment Drift (ungoverned) | Judgment Evolution (governed) |
|------------------------------|-------------------------------|
| Agent changes its own rules silently | Every rule change is a versioned proposal |
| Old behavior is overwritten without trace | Old versions remain inspectable and rollback-ready |
| Short-term metrics improve at cost of long-term values | Changes are evaluated against axioms, not just outcomes |
| Failure modes accumulate | Failure modes are explicitly tracked and addressed |
| Organization loses understanding of why agent acts | Organization retains full audit trail |

KDNA is designed to make judgment evolution explicit and reviewable. It cannot
make drift impossible without application-owned memory, outcomes, permissions,
evaluation, and deployment controls.

---

## Enterprise Implications

Enterprises deploying self-improving agents must answer:

- What has the agent learned?
- Has that learning been reviewed?
- Did it change any judgment standards?
- Who approved the change?
- What is the difference between old and new versions?
- Can we roll back?

KDNA provides the artifacts to answer every one of these questions. A KDNA domain is not just a configuration file. It is a **governed judgment asset**.

---

## For Domain Authors

If you are creating a KDNA domain, you are not just writing rules. You are writing a **judgment constitution** for agents that will learn from work.

To make your domain self-improvement-ready:

1. **Define boundaries explicitly**. Every axiom should have `applies_when` and `does_not_apply_when`.
2. **State failure risks**. Every axiom should have `failure_risk` so the agent knows what is at stake.
3. **Use confidence levels**. Mark which axioms are empirical, which are normative, and which are experimental.
4. **Write eval cases**. Without evals, regression testing is impossible.
5. **Document your value order**. When two axioms conflict, the value order decides.

A domain that is explicit about its boundaries is a domain that can be safely improved.

---

## Relation to Other Concepts

| Concept | Relationship |
|---------|--------------|
| **Prompt engineering** | Prompts tell an agent what to say in one session. KDNA tells it how to judge across all sessions, and governs how that judgment may evolve. |
| **RAG / Knowledge base** | RAG provides facts. KDNA provides the rules for evaluating those facts. |
| **Fine-tuning** | Fine-tuning changes model weights implicitly. KDNA changes judgment standards explicitly, with version control and human approval. |
| **MCP / Tools** | Tools let agents act. KDNA lets agents act with governed judgment. |
| **Agent memory** | Memory records what happened. KDNA records what should be considered correct — and who may change it. |

---

## Summary

Self-improving agents are inevitable. Self-improving agents without judgment governance are dangerous.

KDNA can support a human-governed learning loop by:

1. Separating operational learning from judgment updates
2. Requiring Human Judgment Lock for all changes to axioms, values, boundaries, and risk models
3. Providing structured schemas for traces, outcomes, proposals, and regression tests
4. Making every judgment update versioned, signed, auditable, and rollback-ready

The future is not agents that improve alone. It is agents and humans improving together — with humans holding the keys to what "better" means.
