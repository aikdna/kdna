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
npx kdna dev validate examples/sales

# Schema validation (requires ajv)
npx kdna dev validate --schema examples/sales
```

## Four Questions

### 1. What does this domain judge?

Whether a sales interaction is diagnosis-first and trust-building — or pitch-first and pressure-based. Helps AI agents distinguish facilitation from persuasion.

### 2. Where does it apply?

- Discovery calls and needs assessment
- Price negotiations and objection handling
- Proposal and pitch preparation
- Account management and renewal conversations

### 3. Where does it NOT apply?

- Marketing copy and demand generation
- Customer support and troubleshooting
- Product demonstration of features
- Pricing strategy design

### 4. How do I use it?

```bash
kdna install github:aikdna/kdna-sales
kdna dev validate .
```
