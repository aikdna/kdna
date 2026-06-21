# Management Basic KDNA

A minimal KDNA domain for management judgment. Helps AI agents apply expert management principles: upstream diagnosis, system thinking, and standards-based leadership.

## Core Insight

**Execution problems are created upstream of where they appear.** When a team fails, diagnose the system before addressing the individual.

## What This Domain Covers

- **Axioms (3):** upstream diagnosis, clarity over urgency, standards over personality
- **Key Concepts:** upstream_cause, clarity_gap, feedback_loop
- **Frameworks:** Upstream Diagnosis, Clarity Protocol
- **Banned Terms:** "lazy/unmotivated", "do better/step up", "I told them to", "we need..."
- **Misunderstandings:** motivation vs obstacles, feedback-as-event vs feedback-as-system, doing-it-yourself vs building-capacity
- **Self-Checks (4):** upstream diagnosis, restating expectations, gap description, owner-action-deadline

## Usage

This is a legacy source example. To use it in the current Core v1 path, package
it as a `.kdna` file, validate it, plan loading, then load the compact profile:

```bash
kdna pack . ./management-basic.kdna
kdna validate ./management-basic.kdna
kdna plan-load ./management-basic.kdna
kdna load ./management-basic.kdna --profile=compact --as=prompt
```

## Status

**Legacy source example** — useful for reading the judgment shape. A packaged
`.kdna` file is the runtime artifact.

## License

CC BY 4.0

## Four Questions

### 1. What does this domain judge?

Whether a manager's diagnosis, intervention, or delegation decision addresses the upstream system condition rather than the downstream symptom.

### 2. Where does it apply?

- Team performance issues or missed deadlines
- Delegation and accountability design
- Feedback and one-on-one conversations

### 3. Where does it NOT apply?

- Pure project management (timelines, resource allocation)
- Technical architecture decisions
- Individual contributor work quality review
- HR policy compliance questions

### 4. How do I use it?

```bash
kdna validate ./management-basic.kdna
kdna plan-load ./management-basic.kdna
kdna load ./management-basic.kdna --profile=compact --as=prompt
```
