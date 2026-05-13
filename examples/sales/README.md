# sales — Sales Cognition Domain

A KDNA domain encoding the expert judgment patterns of high-trust, diagnosis-first sales.

## What this domain teaches an AI agent

- Price objections are certainty deficits, not requests for discounts
- Customer silence is internal processing, not disinterest
- Enthusiasm and decision readiness are independent variables
- Discounting without diagnosis destroys value confidence
- The salesperson's role is buying facilitator, not seller

## File structure

| File | Purpose |
|------|---------|
| `KDNA_Core.json` | Axioms: certainty over pitch, signal before push, diagnosis over persuasion |
| `KDNA_Patterns.json` | Banned terms (deal, close, objection handling, discount), misunderstandings |
| `KDNA_Scenarios.json` | Price objection, customer silence, organizational buy-in scenarios |
| `KDNA_Cases.json` | 3 real cases: the discount that backfired, the silent CFO, the enthusiastic champion |
| `KDNA_Reasoning.json` | 4 reasoning chains explaining why each principle works |
| `KDNA_Evolution.json` | 4 growth stages: Pitch-Driven → Question-Driven → Facilitator → System Builder |

## Validation

```bash
# Lint
node validators/kdna-lint.js examples/sales

# Schema validation (requires ajv)
node validators/kdna-validate.js examples/sales
```
