# Improvement Loop Example: decision_state

This directory contains a complete, realistic example of the KDNA Agent Feedback Loop in action.

It demonstrates how a KDNA-loaded agent turns a real-world misclassification into a governed judgment update.

---

## The Story

**May 15, 2026.** A product team uses an AI agent to analyze their async meeting reviews. The team works remotely and uses Loom videos for proposals. Their team charter states:

> "In async Loom reviews, 👍 on a deliverable-bound message = commitment. 👀 = reviewing. ❓ = blocking concern."

The team's lead, Sarah, posts a Loom video:

> "Please 👍 if you can commit to delivering this by May 20."

Four team members react with 👍. In their protocol, this is a binding commitment.

But the KDNA-loaded agent, using `@aikdna/decision_state` v0.7.5, classifies this as **UNRESOLVED**:

> "Emoji reactions do not constitute operational commitment. No one explicitly stated 'I will do this.'"

The agent recommends requesting "explicit written confirmation." Sarah ignores this as bureaucratic overhead. The work is delivered on time.

**The judgment was wrong.** The agent failed to recognize that this team has an explicit async commitment protocol.

---

## The Artifacts

This example includes every artifact in the feedback loop:

### 1. Judgment Trace

[`decision_state/judgment-trace.json`](./decision_state/judgment-trace.json)

Records what the agent actually did:
- Loaded `@aikdna/decision_state` v0.7.5
- Triggered axiom `ax-absence-not-commitment`
- Self-check `sc-owner-named` failed (no verbal commitment found)
- Classification: UNRESOLVED

### 2. Outcome Record

[`decision_state/outcome-record.json`](./decision_state/outcome-record.json)

Records what actually happened:
- Actual classification should have been: EXECUTABLE_DECISION
- Evidence: team charter documents the 👍 protocol
- Impact: erosion of trust in agent judgment
- Suggested change: add boundary condition to `ax-absence-not-commitment`

### 3. Improvement Proposal

[`decision_state/improvement-proposal.json`](./decision_state/improvement-proposal.json)

The structured governance object:
- Proposes revising `ax-absence-not-commitment`
- Evidence: outcome record + survey of 12 async teams
- Risk balance: accepting is safer than rejecting for async teams
- Reviewer counterexamples: "What if someone 👍es without reading?" → addressed by requiring documented protocol
- Status: **accepted**

### 4. Human Judgment Lock

Recorded inside the improvement proposal:

```json
{
  "lock_id": "lock_ds_20260516_001",
  "locked_at": "2026-05-16T14:30:00Z",
  "locked_by": "zhangling",
  "lock_type": "accept",
  "reason": "Evidence strong. Async commitment protocols are a documented pattern. Narrow exception protects against overgeneralization."
}
```

---

## The Result

After the lock, the domain author updates `KDNA_Core.json`:

**Before (v0.7.5):**

```json
{
  "id": "ax-absence-not-commitment",
  "does_not_apply_when": [
    "Formal RFC processes with a documented review window...",
    "On-call rotation handoffs...",
    "Legal or compliance workflows...",
    "Sprint commitment ceremonies..."
  ]
}
```

**After (v0.7.6):**

```json
{
  "id": "ax-absence-not-commitment",
  "does_not_apply_when": [
    "Formal RFC processes with a documented review window...",
    "On-call rotation handoffs...",
    "Legal or compliance workflows...",
    "Sprint commitment ceremonies...",
    "Teams with documented async commitment protocols (e.g., emoji-based reactions, structured tool signals) where the team charter explicitly defines what constitutes commitment"
  ]
}
```

A new eval case is added for async emoji commitment scenarios.

`kdna verify --judgment` passes.
`kdna compare --from 0.7.5 --to 0.7.6` shows the boundary refinement with zero regressions.

The domain is signed and published as v0.7.6.

---

## Lessons

1. **The axiom was not wrong.** "Absence of objection is not presence of commitment" is generally true. But it had an undiscovered boundary.

2. **The agent did exactly what KDNA told it to do.** The failure was in the domain, not the agent. This is why self-improvement must target the judgment layer.

3. **The fix is narrow.** We did not change the core axiom. We added a single `does_not_apply_when` entry with a strict condition: documented protocol required.

4. **Every artifact is auditable.** From trace to lock, every step has a schema, an identity, and a timestamp.

---

## Relation to the Feedback Loop

This example follows the loop defined in [`docs/agent-feedback-loop.md`](../../docs/agent-feedback-loop.md):

```
Agent work (async review classification)
    → Judgment Trace (trace_ds_20260515_001)
    → Outcome Record (out_ds_20260515_001)
    → Failure Classification: Judgment Error (axiom boundary too narrow)
    → Improvement Proposal (prop_ds_20260516_001)
    → Human Review (zhangling, with counterexample stress test)
    → Human Judgment Lock (lock_ds_20260516_001)
    → New Domain Version (0.7.5 → 0.7.6)
    → Regression Test (old evals pass + new async eval added)
    → Deployment (published to registry)
```

---

## Files

| File | Schema | Description |
|------|--------|-------------|
| `judgment-trace.json` | `specs/judgment-trace-schema.json` | What rules the agent triggered |
| `outcome-record.json` | `specs/outcome-record-schema.json` | What actually happened |
| `improvement-proposal.json` | `specs/improvement-proposal-schema.json` | Structured change request |

The Human Judgment Lock is embedded in the improvement proposal under `human_lock`.
