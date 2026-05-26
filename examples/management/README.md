# management — Management Cognition Domain

A KDNA domain encoding expert management judgment: diagnosing upstream system conditions before acting on downstream symptoms.

## What this domain teaches an AI agent

- Execution problems are created upstream of where they appear
- "Unmotivated" is a label, not a diagnosis — fix the system, not the person
- Clarity produces more execution than urgency
- Standards replace the need for constant management
- Psychological safety is performance infrastructure, not a "nice to have"
- When problems surface late, the team has learned that early honesty is punished

## File structure

| File | Purpose |
|------|---------|
| `KDNA_Core.json` | Axioms: upstream before downstream, clarity over urgency, standards not personality |
| `KDNA_Patterns.json` | Banned terms (lazy, do better, just get it done), misunderstandings |
| `KDNA_Scenarios.json` | Missed deadlines, team resistance, late problem surfacing scenarios |
| `KDNA_Cases.json` | 3 real cases: the fired engineer, the CRM rebellion, the dead projects |
| `KDNA_Reasoning.json` | 4 reasoning chains: upstream diagnosis, clarity vs urgency, safety, standards |
| `KDNA_Evolution.json` | 4 growth stages: Person Blamer → System-Aware → Upstream Diagnostician → System Designer |

## Validation

```bash
# Lint
npx kdna dev validate examples/management

# Schema validation (requires ajv)
npx kdna dev validate --schema examples/management
```

## Four Questions

### 1. What does this domain judge?

Whether a manager's diagnosis, intervention, or delegation decision addresses the upstream system condition rather than the downstream symptom.

### 2. Where does it apply?

- Team performance issues or missed deadlines
- Delegation and accountability design
- Feedback and one-on-one conversations
- Hiring, firing, and team structure decisions

### 3. Where does it NOT apply?

- Pure project management (timelines, resource allocation)
- Technical architecture decisions
- Individual contributor work quality review
- HR policy compliance questions

### 4. How do I use it?

```bash
kdna install github:aikdna/kdna-management
kdna dev validate .
```
