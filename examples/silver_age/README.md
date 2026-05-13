# silver_age — Elderly Service Cognition Domain

A KDNA domain encoding expert judgment patterns for serving elderly populations with dignity and understanding.

## What this domain teaches an AI agent

- Low attendance is about psychological entry cost, not activity quality
- "Not interested" is a cover for invisible barriers: fear, embarrassment, burden avoidance
- Seniors are individuals with identities, not a demographic category
- Loneliness is about belonging, not contact frequency
- Technology rejection is about the cost of mistakes, not learning ability
- Autonomy must be preserved in every interaction

## File structure

| File | Purpose |
|------|---------|
| `KDNA_Core.json` | Axioms: dignity over activity, autonomy preservation, invisible barriers |
| `KDNA_Patterns.json` | Banned terms (the elderly, still, we know best), misunderstandings |
| `KDNA_Scenarios.json` | Activity decline, technology anxiety, social withdrawal scenarios |
| `KDNA_Cases.json` | 3 real cases: the empty activity center, the iPad class, missing Mr. Chen |
| `KDNA_Reasoning.json` | 4 reasoning chains explaining why entry cost, autonomy, identity, and exit data matter |
| `KDNA_Evolution.json` | 4 growth stages: Program-Centric → Person-Aware → Dignity Designer → System Builder |

## Validation

```bash
# Lint
node validators/kdna-lint.js examples/silver_age

# Schema validation (requires ajv)
node validators/kdna-validate.js examples/silver_age
```
