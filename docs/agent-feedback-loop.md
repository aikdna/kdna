# Agent Feedback Loop

How a KDNA-loaded agent turns real-world experience into governed judgment evolution.

This document describes the complete pipeline from agent execution to domain update. It is the operational counterpart to the [Human-Governed Self-Improving Agents](./human-governed-self-improvement.md) concept document.

---

## Overview

```
Agent work
    → Judgment Trace
    → Outcome Record
    → Failure Classification
    → Improvement Proposal
    → Human Review
    → Human Judgment Lock
    → New Domain Version
    → Regression Test
    → Deployment
```

Each arrow is a transformation. Each box is an artifact with a defined schema.

---

## Step 1: Agent Work

The agent receives an input, loads one or more KDNA domains, and produces a judgment.

**Inputs:**
- User message or system event
- Loaded KDNA domain(s) with version
- Runtime context (environment, session, tags)

**Outputs:**
- Agent response or action
- Optional: `Judgment Trace` (see Step 2)

A production agent SHOULD generate a Judgment Trace for every KDNA-influenced decision. Without a trace, there is no auditable record of what rules were applied.

---

## Step 2: Judgment Trace

A trace records which KDNA rules were triggered during judgment.

**Schema:** [`specs/judgment-trace-schema.json`](https://aikdna.com/specs/judgment-trace-schema.json)

**Key fields:**
- `trace_id`: unique identifier
- `loaded_package`: which domain(s) and version(s) were loaded
- `triggered_axioms`: which axioms fired
- `triggered_misunderstandings`: which misunderstandings were detected
- `self_checks`: which checks passed or failed
- `selected_scenario`: which scenario was matched
- `generated_judgment`: the final classification and recommendation

When multiple domains are loaded (cluster mode), the trace MUST include:
- `loaded_domains`: array of all loaded domain identifiers
- `conflicts`: any conflicting axioms or values between domains
- `composition_policy_id`: which composition policy resolved the conflict

**Example (minimal):**

```json
{
  "trace_version": "0.1.0",
  "trace_id": "trace_20260523_001",
  "timestamp": "2026-05-23T10:00:00Z",
  "input_hash": "sha256:a3f5c8...",
  "loaded_package": {
    "domain": "@aikdna/decision_state",
    "version": "0.7.1",
    "source": "registry",
    "loaded_files": ["KDNA_Core.json", "KDNA_Patterns.json", "KDNA_Scenarios.json"]
  },
  "triggered_axioms": [
    {
      "id": "ds_ax_structural_problem",
      "statement": "Most decision delays are caused by missing information, not by risk aversion."
    }
  ],
  "generated_judgment": {
    "classification": "MISSING_INFORMATION",
    "confidence": "high",
    "recommended_action": "Identify the three smallest pieces of information that would make this decision executable."
  }
}
```

---

## Step 3: Outcome Record

After the agent acts, reality produces an outcome. The Outcome Record compares the judgment's prediction against what actually happened.

**Schema:** [`specs/outcome-record-schema.json`](https://aikdna.com/specs/outcome-record-schema.json)

**Key fields:**
- `judgment_reference.trace_id`: links back to the trace
- `predicted`: what the judgment predicted
- `actual_outcome.status`: confirmed_correct | partially_correct | incorrect | outcome_unknown
- `revision_needed`: true if the judgment was wrong
- `revision_type`: false_positive | false_negative | misclassification | missing_signal | overconfident
- `feedback.suggested_changes`: human suggestions for domain improvement
- `improvement_proposal_refs`: links to formal improvement proposals (see Step 5)

**When to record:**
- Immediately, if the outcome is knowable (e.g., user confirms the classification was correct)
- After delay, if the outcome takes time (e.g., a decision made with the agent's advice was reviewed a week later)
- Retroactively, if a pattern of failures is discovered during audit

**Important:** `suggested_changes` in the Outcome Record is free-form human feedback. It is NOT a governed change. To become a change, it must be promoted to an Improvement Proposal.

---

## Step 4: Failure Classification

Not every wrong judgment justifies a domain update. Before creating a proposal, classify the failure:

| Classification | Cause | Action |
|----------------|-------|--------|
| **Operational** | The agent used the right judgment but executed poorly (wrong tool call, bad formatting, ignored output instructions) | Fix agent code or prompt. No domain change needed. |
| **Evidence Gap** | The domain lacks cases for this situation | Add a case to `KDNA_Cases.json`. May be auto-recorded. |
| **Signal Misclassification** | The agent matched the wrong scenario or axiom | Review `triggered_axioms` and `selected_scenario` in the trace. Consider updating scenario signals. |
| **Judgment Error** | The axiom itself is wrong, incomplete, or mis-prioritized | This requires a Judgment Update. Create an Improvement Proposal. |
| **Boundary Violation** | The agent did something the domain explicitly forbade | Operational fix: better self-check enforcement. If self-checks were correct but agent ignored them, fix runtime, not domain. |
| **Value Conflict** | Two axioms conflicted and the agent chose the wrong priority | Review `value_order` in `KDNA_Core.json`. Requires Judgment Update. |

Only **Judgment Error** and **Value Conflict** should produce Improvement Proposals targeting axioms, values, or boundaries.

---

## Step 5: Improvement Proposal

An Improvement Proposal is a structured, versioned request to change a KDNA domain's judgment layer.

**Schema:** `specs/improvement-proposal-schema.json`

**Key fields:**
- `proposal_id`: unique identifier
- `source`: outcome_record | human_feedback | eval_failure | trace_analysis | agent_reflection
- `domain`: target domain (e.g., `@aikdna/decision_state`)
- `domain_version`: version the proposal applies to
- `proposed_change_type`: add_axiom | revise_axiom | add_misunderstanding | revise_boundary | add_scenario_signal | revise_risk_model | update_self_check
- `target_element`: which file and element to change
- `evidence`: array of trace IDs, outcome IDs, or eval results supporting the change
- `reason`: human-readable rationale
- `risk_if_accepted`: what could go wrong if this change is adopted
- `risk_if_rejected`: what could go wrong if this change is ignored
- `requires_human_lock`: always `true` for judgment updates
- `status`: proposed | under_review | accepted | rejected | deferred

**Example:**

```json
{
  "proposal_id": "prop_ds_20260523_001",
  "source": "outcome_record",
  "domain": "@aikdna/decision_state",
  "domain_version": "0.7.1",
  "proposed_change_type": "revise_axiom",
  "target_element": {
    "file": "KDNA_Core.json",
    "element_id": "ds_ax_structural_problem"
  },
  "evidence": [
    {
      "type": "outcome_record",
      "id": "out_20260523_001",
      "summary": "Agent classified 3 of 5 risk-aversion cases as missing-information. All 3 were incorrect."
    }
  ],
  "reason": "The axiom is too strong. Risk aversion is a real cause of decision delay, not just missing information. The axiom should acknowledge both causes.",
  "risk_if_accepted": "Agent may over-diagnose risk aversion and under-diagnose missing information.",
  "risk_if_rejected": "Agent will continue to misclassify genuine risk-aversion cases, leading to inappropriate action recommendations.",
  "requires_human_lock": true,
  "status": "proposed"
}
```

An agent MAY propose an Improvement Proposal automatically. It MUST NOT apply one without Human Judgment Lock.

---

## Step 6: Human Review

A human reviewer — ideally the domain author or a designated governance role — examines the proposal.

**Review checklist:**
1. **Evidence quality**: Is the evidence sufficient? Are the cases representative?
2. **Boundary check**: Does the change weaken any existing boundary?
3. **Conflict check**: Does the new axiom conflict with existing axioms or values?
4. **Risk balance**: Is `risk_if_accepted` worse than `risk_if_rejected`?
5. **Generality**: Is this a one-off case or a genuine pattern?
6. **Value alignment**: Does the change align with the domain's `value_order`?

The reviewer may:
- **Accept** the proposal as-is
- **Reject** the proposal with a documented reason
- **Defer** the proposal pending more evidence
- **Modify** the proposal and re-review

AI MAY assist the review by:
- Playing challenger: generating counterexamples and stress tests
- Checking consistency: verifying the proposal against all existing axioms
- Summarizing impact: predicting which eval cases would change behavior

But the final decision MUST be human.

---

## Step 7: Human Judgment Lock

Once accepted, the proposal receives a Human Judgment Lock.

This is recorded in the domain's `KDNA_Evolution.json` as:

```json
{
  "human_locks": [
    {
      "lock_id": "lock_20260523_001",
      "proposal_id": "prop_ds_20260523_001",
      "locked_at": "2026-05-23T14:00:00Z",
      "locked_by": "zhangling",
      "lock_type": "accept",
      "reason": "Evidence is strong. 3 misclassifications in one week. Risk balance favors change."
    }
  ]
}
```

A domain package MUST NOT be published with judgment updates that lack corresponding human locks.

Validators SHOULD check: if `axioms`, `value_order`, `boundaries`, or `risk_model` changed between versions, a human lock MUST exist in `KDNA_Evolution.json`.

---

## Step 8: New Domain Version

The accepted change is applied to the domain. The domain receives a new version.

**Versioning rules:**
- **Semver bump** (`0.7.1` → `0.7.2`): for content changes, new axioms, revised boundaries
- **Judgment version bump** (`2026.05` → `2026.06`): when judgment surface changes significantly (new axioms, changed value order, new failure risks)
- Major semver bump (`0.7.x` → `0.8.0`): for breaking schema changes or removed axioms

The updated domain MUST be:
1. Structurally validated (`kdna validate`)
2. Behaviorally validated (`kdna verify --judgment`)
3. Signed with the domain author's Ed25519 key (`kdna publish`)

---

## Step 9: Regression Test

Before deployment, the new version MUST pass regression tests.

**What to test:**
1. **Old evals still pass**: All previous `evals/` cases must produce the same or better results.
2. **New evals added**: The change that prompted the proposal should have at least one new eval case.
3. **Axiom trigger check**: Known axiom triggers must still fire correctly.
4. **Banned term avoidance**: Banned terms must still be avoided.
5. **Scenario classification**: Scenario matches must not regress.

**CLI support:**

```bash
# Run all evals for a domain
kdna verify @aikdna/decision_state --judgment

# Compare two versions for regression
kdna compare @aikdna/decision_state --from 0.7.1 --to 0.7.2 --evals ./evals/

# Expected output:
# - New evals: 1/1 passed
# - Old evals: 10/10 passed (0 regressions)
# - Axiom trigger changes: ds_ax_structural_problem now triggers on "risk aversion" signals
# - Risk flags: none introduced
```

If any old eval fails, the change MUST be reconsidered. A judgment update that fixes one case but breaks two others is not an improvement.

---

## Step 10: Deployment

Once validated and regression-tested, the new domain version is deployed.

**To registry:**
```bash
kdna publish ./decision_state --release-tag v0.7.2 --repo aikdna/kdna-decision_state
```

**To agent runtime:**
```bash
kdna update @aikdna/decision_state
```

Agents loading the domain after update will use the new judgment standards. Agents with existing sessions SHOULD complete with the old version unless the runtime explicitly supports mid-session reloading.

---

## Complete Example: A Single Loop

**Day 1:** Agent uses `@aikdna/decision_state` to help a user with a delayed decision. Agent classifies it as `MISSING_INFORMATION`.

**Day 3:** User reports back: "I had all the information I needed. I was just afraid of the consequences." Outcome Record created with `actual_outcome.status: incorrect`, `revision_type: misclassification`.

**Day 3 (auto):** Agent reflection module proposes an Improvement Proposal: `revise_axiom` on `ds_ax_structural_problem`.

**Day 4:** Domain author reviews. Evidence: 3 similar misclassifications this week. Risk balance favors change. Accepts with Human Judgment Lock.

**Day 4:** Author edits `KDNA_Core.json`, adds `does_not_apply_when` to the axiom, bumps version to `0.7.2`, adds a new eval case for risk-aversion detection.

**Day 4:** `kdna verify --judgment` → 11/11 evals pass (10 old + 1 new). `kdna compare --from 0.7.1 --to 0.7.2` → no regressions.

**Day 5:** Published to registry. Agents worldwide now handle risk-aversion cases correctly.

---

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|--------------|--------------|
| **Auto-apply all suggestions** | Agent degrades judgment quality by overfitting to recent feedback. |
| **No trace generation** | When something goes wrong, you cannot know what rules were applied. |
| **Skip regression tests** | "Fixing" one case often breaks others. Without regression, you won't know. |
| **Human lock without evidence** | Governance becomes bureaucracy. Every lock should reference specific proposals and outcomes. |
| **Update axioms without updating evals** | The change is untested. The eval suite must grow with the domain. |

---

## Summary

The Agent Feedback Loop turns experience into governed judgment evolution:

1. **Trace** every judgment
2. **Record** every outcome
3. **Classify** failures correctly
4. **Propose** structured changes
5. **Review** with human judgment
6. **Lock** accepted changes
7. **Version** the domain
8. **Regress** before deploying
9. **Deploy** with confidence

Without this loop, agents drift. With it, agents evolve.
