# KDNA Governance Console

The KDNA Governance Console is the organizational interface for approving, publishing, rolling back, and auditing judgment updates.

While [KDNA Studio](./kdna-studio-principles.md) produces judgment assets, the Governance Console governs their organizational lifecycle. It ensures that self-improving agents cannot drift — not because agents are forbidden from learning, but because every judgment update is visible, reviewed, and deliberately approved.

---

## Core Purpose

Organizations deploying self-improving agents need to answer:

- What has the agent learned?
- Has that learning been reviewed?
- Did it change any judgment standards?
- Who approved the change?
- What is the difference between old and new versions?
- Can we roll back?

The Governance Console provides the interface to answer every one of these questions.

---

## What the Governance Console Does

### 1. Improvement Proposal Review

Agents and humans submit improvement proposals. The Console is where these proposals are reviewed:

- **Ingest** proposals from agent runtimes, eval failures, or human suggestions
- **Display** evidence: traces, outcomes, eval results, risk assessments
- **Assign** reviewers based on domain expertise and organizational role
- **Track** proposal status: proposed → under_review → accepted / rejected / deferred
- **Record** Human Judgment Lock for every accepted proposal

### 2. Domain Lifecycle Management

The Console manages the full lifecycle of judgment assets within an organization:

- **Draft** → domains under development in Studio
- **Review** → domains submitted for organizational approval
- **Approved** → domains cleared for internal deployment
- **Published** → domains published to registry (public or private)
- **Deprecated** → domains scheduled for replacement
- **Yanked** → domains withdrawn due to critical defects

### 3. Audit and Compliance

Every judgment update is auditable:

- Who proposed the change
- What evidence supported it
- Who reviewed it
- What decision was made and why
- When it was deployed
- Whether it introduced regressions

The Console exports full audit trails for compliance review.

### 4. Registry Governance

For organizations running private registries:

- Approve which domains enter the organizational registry
- Enforce quality gates (minimum eval count, verify score thresholds)
- Manage scope trust and signing keys
- Control which domains different teams or agents may load

### 5. Rollback and Recovery

When a deployed judgment update causes problems:

- Identify the affected version
- Revert to the previous version
- Notify all consuming agents
- Document the rollback reason
- Create a new proposal addressing the underlying issue

---

## Governance Console vs. Studio

| Concern | KDNA Studio (Production) | KDNA Governance Console (Approval) |
|---------|--------------------------|-----------------------------------|
| **Primary user** | Domain author, expert | Governance officer, team lead, compliance |
| **Core activity** | Articulate, challenge, lock, test judgment | Review, approve, audit, rollback judgment updates |
| **AI role** | Interviewer, challenger, compiler, evaluator | Evidence summarizer, consistency checker, risk flagger |
| **Human lock** | Author locks their own judgment before export | Reviewer locks organizational approval before deployment |
| **Output** | Signed `.kdna` package | Approved, deployed, auditable domain version |
| **Eval focus** | Does this domain express good judgment? | Does this update improve judgment without regression? |

The Studio and Governance Console are connected but separate:

- Studio **produces** draft domains and submits them
- Governance Console **reviews** proposals and approves deployment
- Both use the **KDNA CLI** as their shared protocol layer
- Both read and write the **same schemas** (improvement proposals, human locks, eval results)

---

## Governance Roles

| Role | Responsibility |
|------|----------------|
| **Domain Author** | Creates and maintains a KDNA domain. Uses Studio to articulate judgment. |
| **Proposal Reviewer** | Reviews improvement proposals. Examines evidence, evaluates risks, decides accept/reject/defer. |
| **Governance Officer** | Manages organizational registry policy. Enforces quality gates. Handles audits. |
| **Runtime Operator** | Deploys approved domains to agent runtimes. Monitors production judgment quality. |

A single person may hold multiple roles. In small teams, the Domain Author may also be the Proposal Reviewer. In enterprises, these roles are typically separate.

---

## The Organizational Feedback Loop

```
Agent work (production)
    → Judgment Trace + Outcome Record
    → Improvement Proposal (auto or human-created)
    → Governance Console Review Queue
    → Reviewer examines evidence and risk
    → Human Judgment Lock (organizational approval)
    → Domain Author updates domain in Studio
    → Regression Test (old + new evals)
    → Governance Console approves publication
    → Deploy to agent runtime
    → Agent uses updated judgment
```

This loop ensures that agent learning is channeled through human governance without becoming a bottleneck.

---

## Quality Gates

The Governance Console enforces configurable quality gates before a domain or update is approved:

| Gate | Minimum | Purpose |
|------|---------|---------|
| Structural validation | Pass | JSON is valid and schema-compliant |
| Behavioral validation | Verify score ≥ threshold | Judgment quality is measurable |
| Eval coverage | Minimum N cases | Edge cases are tested |
| Regression test | Zero regressions | Old capabilities are preserved |
| Human lock | Present | Every judgment update is human-approved |
| Signature | Valid Ed25519 | Domain integrity is cryptographically assured |

Organizations may configure stricter gates. The Console blocks deployment of any domain that fails a required gate.

---

## Integration with KDNA CLI

The Governance Console is a UI layer over the KDNA CLI protocol:

```bash
# Ingest a proposal (Phase 6 — CLI implementation pending)
kdna proposal ingest ./proposal.json --console

# Review queue (Phase 6 — CLI implementation pending)
kdna proposal list --status under_review

# Apply human lock (Phase 6 — CLI implementation pending)
kdna proposal lock prop_ds_001 --accept --reason "Evidence is strong."

# Regression test before approval (Phase 6 — CLI implementation pending)
kdna verify @aikdna/decision_state --judgment --regression

# Publish approved domain
kdna publish ./dist/decision_state.kdna --release-tag v0.7.2
```

The Console may wrap these commands in a web interface, but the protocol remains the CLI. This ensures that governance actions are scriptable, auditable, and not locked into any single UI.

---

## Summary

KDNA Studio produces judgment. KDNA Governance Console governs its evolution.

Together they implement the core principle:

> Agent can learn from work. But judgment updates require governance.

The Studio ensures judgment is human-articulated. The Console ensures judgment updates are human-approved. The CLI powers both. This is the complete infrastructure for human-governed self-improving agents.
