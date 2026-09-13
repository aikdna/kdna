# Case Study: The $40,000 Meeting That Wasn't a Decision (Illustrative Composite)

> **This is an illustrative composite scenario, not a measured outcome.** It is
> a teaching composite assembled from generic patterns. It is not a real
> customer, a reproduced benchmark, or verified business impact. Every dollar
> amount is a scenario assumption, not an observed or saved figure. Every agent
> output below is an illustrative expectation, not a captured production run.

## Background

**Company:** Series B SaaS startup, 45 employees  
**Team:** Product and Engineering leadership  
**Meeting:** Quarterly planning session, March 2024  
**Stakeholders:** VP Product, CTO, 3 Engineering Leads, 2 PMs

The team spent 90 minutes discussing their infrastructure roadmap. The CTO presented concerns about the current monolith architecture. Everyone agreed "we should migrate to microservices." The VP Product said "this is important for scaling." One engineering lead said "I'll look into it." No specific services were identified. No owner was assigned. No timeline was set. No budget was approved.

The meeting ended. Everyone felt productive.

---

## What Happened Next

### Week 1: The Slack Message

The CTO posted in #engineering-leads:

> "Great alignment in today's planning session. We're moving to microservices. @eng-lead-1 can you start breaking down the monolith?"

### Week 2: The Jira Tickets

Engineering Lead 1 created 12 tickets for "microservice extraction." Two senior engineers were assigned. No one questioned whether this was actually decided.

### Week 3: The Pull Requests

Developers began extracting a user service from the monolith. The work touched authentication, billing, and analytics — systems owned by different teams.

### Week 4: The Collision

The billing team was simultaneously refactoring their module. Their changes conflicted with the microservice extraction. A production incident occurred. Rollback took 6 hours.

### Week 8: The Reversal

The VP Product pulled the plug. The extraction was 30% complete, had caused 2 incidents, and no one could articulate what problem it was solving or what success looked like.

**Direct cost (scenario assumption, not measured):** $40,000 in engineering time  
**Indirect cost (scenario assumption, not measured):** 6 weeks of lost roadmap velocity, team morale damage, trust erosion between Product and Engineering

---

## The Root Cause

The team never actually made a decision. They had a **discussion** and mistook it for a **decision**.

| Operational Commitment Element | Present? |
|---|---|
| **Explicit choice** (what specifically are we doing?) | No — "microservices" is a category, not a choice |
| **Owner** (who is responsible for outcome?) | No — "I'll look into it" is not ownership |
| **Action** (what concrete step is taken?) | No — no specific service identified |
| **Timing** (when is this done / reviewed?) | No — no deadline, no review date |

This is a classic **false actionization**: treating an UNRESOLVED discussion as an EXECUTABLE decision.

---

## What the Baseline AI Is Expected to Produce

In this scenario, a baseline AI meeting assistant summarizes the planning session. The illustrative output is:

> **Q1 Planning Session Summary**
> 
> The team discussed infrastructure scaling and agreed to migrate from monolith to microservices architecture. Engineering will begin service extraction. Next steps: continue breakdown and implementation.

This summary is fluent, professional, and **dangerously wrong**. It reports:
- "agreed" — social agreement, not operational commitment
- "will begin" — implies execution is authorized
- No missing elements flagged
- No misunderstandings detected

Anyone reading this summary would believe a decision was made. The AI summarized the conversation without judging whether a decision actually occurred.

---

## What the KDNA-Loaded AI Is Expected to Produce

The same input analyzed with the `decision_state` KDNA domain loaded is expected to produce:

> **Classification:** UNRESOLVED
> 
> **Missing Elements:**
> - owner (no single person responsible for outcome)
> - timing (no deadline or review date)
> - explicit choice ("microservices" is a category, not a specific migration plan)
> 
> **Misunderstandings Detected:**
> - Social agreement mistaken for commitment (MS-001): "Everyone agreed" does not mean a decision was made
> - Action items without owners/deadlines (MS-002): "I'll look into it" is not an action item
> 
> **Triggered Axioms:**
> - AX-001: A discussion is not a decision until all four operational commitment elements are present
> - AX-003: The presence of one element does not imply the presence of the others
> 
> **Triggered Frameworks:**
> - FW-001: Operational Commitment Test (choice, owner, action, timing)
> 
> **Self-Checks:**
> - SC-1: Did I verify all four operational commitment elements? → FAILED (3 missing)
> - SC-2: Did I distinguish social agreement from explicit choice? → FAILED
> 
> **Recommended Action:**
> Before execution: assign owner, timing, and explicit choice. Do not treat as decided. Suggest: schedule follow-up within 48 hours with specific service boundary proposal and owner assignment.

---

## The Difference in This Scenario (Expected, Not Measured)

| Dimension | Baseline AI (expected) | KDNA-Loaded AI (expected) |
|---|---|---|
| **Output type** | Summary | Judgment |
| **Decision state** | Implied executable | Explicitly UNRESOLVED |
| **Missing elements** | None flagged | 3 identified |
| **Misunderstandings** | None detected | 2 detected with codes |
| **Business risk** | Enables false execution | Prevents premature execution |
| **Traceability** | None | Axioms, frameworks, self-checks all logged |

In this scenario the KDNA-loaded output is expected to do more than describe
what happened: it names what kind of situation this is and recommends blocking
execution. Whether that recommendation changes a real outcome is not measured
here, and the comparison above is an expectation, not a paired result.

---

## Expected Judgment Trace (Illustrative)

A trace an implementation is expected to report for this composite input has
this shape. It is an illustration of the reporting format, not a captured
artifact:

```json
{
  "loaded_package": "decision_state",
  "version": "0.2",
  "triggered_axioms": ["AX-001", "AX-003"],
  "triggered_frameworks": ["FW-001"],
  "triggered_ontology": ["unresolved", "operational_commitment"],
  "misunderstandings_detected": ["MS-001", "MS-002"],
  "self_checks": [
    {"check": "SC-1", "passed": false, "reason": "Missing explicit choice, owner, timing"},
    {"check": "SC-2", "passed": false, "reason": "Social agreement detected without explicit choice"}
  ],
  "classification": "UNRESOLVED",
  "confidence": "high",
  "recommended_action": "Before execution: assign owner, timing, explicit choice"
}
```

A trace in this shape is designed to be inspectable and bound to an asset
version, so a reviewer can see which axiom or framework produced a
classification. This illustration does not show that such a trace was captured
from a run, and it is not evidence that the classification is correct.

---

## Business Impact (Scenario Reasoning, Not a Measured Result)

| Scenario | Outcome |
|---|---|
| **Without KDNA (assumed)** | $40,000 of engineering time assumed spent, 6 weeks assumed lost, team conflict, production incidents |
| **With KDNA (assumed)** | Meeting flagged as UNRESOLVED before execution. Follow-up scheduled within 48 hours. Owner, timeline, and scope assigned. Execution proceeds under a stated mandate. |

**ROI: not established.** The $40,000 is a scenario assumption used to size the
example, not an observed loss and not a saving. Loading and running a judgment
asset also has its own compute and authoring cost; this document does not
measure it and does not claim a near-zero implementation cost or any realized
return.

---

## Why This Matters

This case is not unique. Variants of it show up across companies and teams —
the examples below are additional illustrations, not measured incidents:

- "We should improve onboarding" → engineers build features without defined success metrics
- "Let's revisit the pricing model" → sales team changes quotes without approval process
- "Everyone is aligned on the redesign" → product ships without user validation

In each case, the failure is not technical. It is **categorical**: the team believes they are in "execution mode" when they are actually in "clarification mode."

AI assistants that summarize without judging actively amplify this problem. They lend the authority of formal output to informal discussion. They turn "we should" into "we will."

KDNA does the opposite. It adds a **judgment gate** between discussion and execution. It asks: *before we act, do we actually have a decision?*

---

## Key Takeaways

1. **False actionization is a real risk pattern.** This document illustrates the pattern; it does not measure how often it occurs or what it costs.
2. **Summarization is not judgment.** An AI that summarizes well can still mislead dangerously.
3. **A loaded judgment can change the output.** On this composite input the two paths are expected to produce different classifications. Equal correct answers are also a normal result and do not make an asset fail.
4. **Judgment traces enable accountability.** When the AI flags something as UNRESOLVED, you can inspect exactly why. When it misses something, you can trace the failure.
5. **Prevention is cheap to attempt; its payoff is unmeasured here.** Checking for a decision before executing costs a review step. Whether that prevents a specific loss is a claim this document does not support.

---

*This case study is an illustrative composite, not a measured result; identifying details are invented. The agent outputs and judgment trace shown above are expected illustrations of the named domain's declared judgment, not captured runs — no benchmark artifact, paired experiment, or customer record backs them. Replace this note only when a reproducible experiment naming the task, model, input, and evaluation method is available.*
