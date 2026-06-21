# Decision State KDNA

A minimal KDNA domain for judging whether a discussion has produced an actionable decision.

## Purpose

Helps AI agents distinguish between:
- **Discussion** — exchange of views, no commitment
- **Decision** — commitment to action with owner and deadline

## Core Files

- `KDNA_Core.json` — Core axioms and ontology
- `KDNA_Patterns.json` — Common misunderstandings and self-checks

## Load Condition

Load when analyzing meeting outcomes, project status, or decision quality.

## Four Questions

### 1. What does this domain judge?

Whether a meeting, discussion, or planning session has produced an actionable decision — or merely the appearance of progress. It classifies outcomes into four states: UNRESOLVED (missing commitment elements), CONDITIONAL (committed but gated), INTENTIONAL_DEFERRAL (structured decision to decide later), and EXECUTABLE_DECISION (all elements present, no blockers).

### 2. Where does it apply?

- Analyzing meeting transcripts, project updates, team discussions
- Any collaborative text where actionability is in question
- Retrospectives assessing whether a meeting was productive
- Project management tools evaluating task readiness

### 3. Where does it NOT apply?

- Individual brainstorming or ideation sessions with no expectation of immediate commitment
- Social conversations, informal chats, or relationship-building meetings
- Technical analysis where the output is understanding, not action
- One-person decisions (use personal priority frameworks instead)
- Evaluating decision quality after execution (this domain judges existence, not quality)

### 4. How do I use it?

```bash
kdna pack . ./decision-state.kdna
kdna validate ./decision-state.kdna
kdna plan-load ./decision-state.kdna
kdna load ./decision-state.kdna --profile=compact --as=prompt
```

## License

CC-BY-4.0
