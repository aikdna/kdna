# Authoring Pipeline Principles

A KDNA-compatible authoring pipeline is the judgment production interface. It helps humans turn implicit expertise into explicit, structured, testable, and versioned judgment assets.

It is not a domain generator. It is not an AI autopilot for judgment. It is the workshop where domain authors discover, articulate, challenge, lock, and export their judgment.

---

## Core Principles

### 1. Human judgment is the source

AI may interview. AI may challenge. AI may compile and test. But the judgment itself originates from the human domain expert.

the authoring pipeline makes this explicit in its workflow:
- The author speaks their judgment.
- The AI asks clarifying questions and generates counterexamples.
- The author refines, rejects, or confirms.
- Only after provenance is explicit should judgment enter a reviewed release.
  Human Judgment Lock is one optional provenance signal, not a universal Core
  format-validity requirement.

The Studio does not replace human expertise. It makes expertise extraction structured, efficient, and reproducible.

### 2. The Studio is not a generator

A KDNA-compatible authoring pipeline does not "write KDNA for you." It provides:
- An interview flow that surfaces implicit judgment
- Card-based organization of judgment elements (axioms, boundaries, scenarios)
- Counterexample challenges to stress-test each judgment
- Validation that catches structural errors before export
- A Test Lab for running evals against the emerging domain
- Export to versioned, signed `.kdna` packages

The success metric is not "did it export a `.kdna` file?" but "did the user articulate, reject, modify, supplement,复述, test, and iterate their own judgment?"

There is no "one-click generate domain" button.

### 3. AI assists, does not decide

Within the Studio, AI plays four helper roles:

| Role | What AI does | What human does |
|------|--------------|-----------------|
| **Interviewer** | Asks questions to surface implicit judgment | Answers, clarifies, and corrects |
| **Challenger** | Generates counterexamples and edge cases | Evaluates whether the counterexamples are valid concerns and refines the judgment |
| **Compiler** | Transforms articulated judgment into structured KDNA JSON | Reviews the structure for accuracy and completeness |
| **Evaluator** | Runs eval suites and reports pass/fail/gaps | Interprets results and decides if quality is sufficient for export |

At no point does AI decide what the judgment should be.

### 4. Provenance before reviewed export

The Studio can enforce a strict review workflow before judgment enters a
reviewed release file:

1. Judgment articulated (interview or manual entry)
2. AI-assisted challenge (counterexamples generated)
3. Human review and refinement
4. Provenance record, with optional Human Judgment Lock when human confirmation is claimed
5. Structural validation
6. Behavioral validation (Test Lab)
7. Version bump, signature, and export

This provenance ensures that every axiom, boundary, and value in a reviewed
`.kdna` release has an explicit authoring and review status.

### 5. The Studio produces governed assets

The Studio's output is not just a file. It is a **governed judgment asset**:
- Signed with the author's Ed25519 key
- Versioned with both semver and judgment_version
- Accompanied by eval cases that validate its behavior
- Documented with Scope / Out-of-Scope declarations
- Ready for registry publication and agent consumption

### 6. Studio is the production layer, not the governance layer

A KDNA-compatible authoring pipeline handles **how judgment assets are created**.

**KDNA Governance Console** (a separate future product) handles **how judgment updates are approved, published, rolled back, and audited** within an organization.

| Concern | Studio (Production) | Governance Console (Approval) |
|---------|---------------------|-------------------------------|
| Create a new domain | Yes | No |
| Edit axioms and boundaries | Yes | No |
| Review improvement proposals from agents | No | Yes |
| Approve/reject proposed changes | No | Yes |
| Audit who changed what and why | No | Yes |
| Manage registry promotion pipelines | No | Yes |
| Roll back a published domain version | No | Yes |

The Studio may *submit* a domain to the Governance Console. It does not *govern* the organizational approval process.

---

## Studio Workflow

### Phase 1: Discovery

The author identifies a judgment they hold but have never articulated.

- AI interviewer asks: "What do you know about X that a novice gets wrong?"
- Author responds in natural language
- AI identifies candidate judgment elements (potential axioms, boundaries, misunderstandings)

### Phase 2: Articulation

Candidate judgments are converted into structured cards.

- Each card has a type: axiom, boundary, scenario, misunderstanding, etc.
- Author edits the card directly
- AI suggests refinements based on pattern recognition across domains

### Phase 3: Challenge

AI generates counterexamples and stress tests for each card.

- "When would this axiom be wrong?"
- "What situation violates this boundary but should be allowed?"
- "What misunderstanding does this not catch?"

Author decides: keep, modify, or discard.

### Phase 4: Human Judgment Lock

Author explicitly locks each card.

- Lock records: who, when, and a confirmation statement
- Locked cards become part of the formal domain
- Unlocked cards remain in draft

### Phase 5: Test Lab

The emerging domain is tested against real inputs.

- Load the domain into a sandbox agent
- Run eval cases
- Compare with/without KDNA (`kdna compare`)
- Author iterates based on results

### Phase 6: Export

The domain is validated, signed, and exported.

- `kdna dev validate` — structural check
- `kdna verify --judgment` — behavioral score
- Ed25519 signature applied
- `.kdna` package generated
- Ready for `kdna publish`

---

## What the Studio Is Not

| Misconception | Reality |
|---------------|---------|
| "An AI that writes KDNA files" | The Studio is a production workshop. Humans articulate judgment. AI only assists. |
| "A prompt engineering tool" | The Studio deals with structured judgment assets, not one-off prompts. |
| "A no-code domain builder" | Domain creation requires domain expertise. The Studio structures that expertise, it does not replace it. |
| "An auto-updater for agent behavior" | No automatic judgment updates. Every judgment element is human-locked before export. |
| "A governance dashboard" | Governance, audit, and approval workflows belong to KDNA Governance Console, not Studio. |
| "A registry browser" | While the Studio can import registry domains for remixing, its primary purpose is production, not discovery. |

---

## Studio and the Ecosystem

| Component | Role | Studio Relationship |
|-----------|------|---------------------|
| **KDNA CLI** | Protocol control plane — validation, comparison, publishing | Studio calls CLI commands for Test Lab and export |
| **Registry** | Domain discovery and distribution | Studio exports packages ready for registry publication |
| **Agent Runtime** | Loads KDNA and generates judgments | Studio's Test Lab uses a sandbox runtime for validation |
| **Eval Suite** | Tests judgment quality | Studio runs evals during Test Lab phase |
| **KDNA Governance Console** | Organizational approval, audit, rollback | Receives domains from Studio for governance review |
| **a KDNA-compatible client** | Consumer-facing agent with built-in Studio Beta | a KDNA-compatible client Studio Beta is the first embedded implementation |

---

## Design Consequences

These principles have concrete implications for Studio implementation:

1. **No "Generate Domain" button.** The primary action is "Lock Judgment" and "Run Test Lab," not "Auto-Generate."
2. **Lock-first workflow.** Every judgment element must be explicitly locked before it enters the exported domain.
3. **Challenge mode is default.** The Studio should proactively generate counterexamples, not wait for the user to ask.
4. **Test Lab integration.** Validation and comparison are first-class UI features, not afterthoughts.
5. **Identity-bound.** Every exported domain is signed with the author's identity key. Anonymous exports are not permitted.
6. **Iteration-centric.** The UI should make it easy to revise locked judgments, re-run tests, and re-export — judgment is iterative, not one-shot.

---

## Summary

the authoring pipeline exists because human judgment is the scarce resource in the agent era.

The Studio does not replace human judgment. It makes human judgment **articulable, challengeable, testable, and transferable** across the agent ecosystem.

Studio authors assets and the CLI operates them. Applications may add
governance, memory, outcomes, evaluation, and deployment policy around these
primitives; KDNA does not claim to provide that complete infrastructure.
