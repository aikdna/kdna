# Evaluating KDNA Effectiveness

> [中文版](./evaluation.zh.md) · See also: [Meta-Cognition](./meta-cognition.md)

> This is an external evaluation method, not a KDNA Core quality or promotion
> authority. Every result must identify the evaluator, exact asset, task and
> population scope, rubric, model/tool coordinates, method, time, and evidence.
> Different evaluators may legitimately reach different conclusions.

KDNA claims to improve agent judgment. This document defines how to test that claim.

## Core Principle

> **KDNA is working if the agent's reasoning trajectory changes, not just its wording.**

A KDNA-shaped answer should be diagnostically different from a generic one — not just better-phrased.

## Scoring Dimensions

Rate each dimension 1–5. A KDNA-loaded answer should score higher than the no-KDNA baseline on most dimensions.

| # | Dimension | What to check |
|---|---|---|
| D1 | **Diagnostic depth** | Does the answer identify root causes, not just surface symptoms? |
| D2 | **Terminology consistency** | Does the answer use preferred domain terms and avoid banned ones? |
| D3 | **Misunderstanding detection** | Does the answer catch implied misunderstandings in the user's input? |
| D4 | **Axiom alignment** | Does the reasoning follow domain axioms rather than generic common sense? |
| D5 | **Scenario classification** | Does the answer correctly classify the situation type? |
| D6 | **Actionable specificity** | Is the guidance concrete and domain-specific, not generic advice? |
| D7 | **Boundary awareness** | Does the answer know what it should NOT do or claim? |
| D8 | **Self-check pass rate** | What percentage of domain self-check items does the answer satisfy? |

## A/B Test Design

For each domain, define test cases. Compare the same input with and without KDNA loaded.

### Test Case Format

```json
{
  "id": "sales_price_objection_01",
  "domain": "sales",
  "input": "The customer says our service is too expensive. What should I do?",
  "without_kdna_expected": {
    "likely_response_pattern": "Suggest discount or explain value features",
    "failure_mode": "Treats price objection as a pricing problem rather than a certainty deficit"
  },
  "with_kdna_expected": {
    "likely_response_pattern": "Diagnose which certainty dimension is missing (value, fit, risk, social) before responding",
    "success_signal": "Identifies the objection as a certainty signal, not a price negotiation trigger"
  },
  "scoring_weight": {
    "D1_diagnostic_depth": 5,
    "D3_misunderstanding_detection": 5,
    "D4_axiom_alignment": 4,
    "D5_scenario_classification": 3
  }
}
```

### Test Suite Structure

```
evals/
├── sales/
│   ├── price_objection.json
│   ├── trust_deficit.json
│   └── urgency_trap.json
├── communication/
│   ├── conflict_escalation.json
│   └── emotional_deflection.json
└── management/
    ├── execution_failure.json
    └── delegation_avoidance.json
```

Each domain should have at least 3 test cases covering its core distinctions.

## Minimum Viable Evaluation

Start with the simplest possible test:

1. Pick one domain and one test case.
2. Run the same input through the agent twice: once without KDNA, once with KDNA loaded.
3. Compare the reasoning paths — not just the final answer, but the assumptions, diagnostic moves, and terminology used.
4. Score both on D1–D8.
5. If the KDNA-loaded answer does not score at least 2 points higher on the weighted dimensions, the KDNA domain is not working.

## Self-Check as Auto-Evaluation

Each domain's `KDNA_Patterns.json` contains `self_check` items. These can be used as automated evaluation:

| Self-check type | Evaluation use |
|---|---|
| "Did the answer use [preferred term]?" | Terminology consistency |
| "Did the answer avoid [banned term]?" | Negative pattern detection |
| "Did the answer diagnose before prescribing?" | Axiom alignment |
| "Did the answer identify which type of [X]?" | Scenario classification |

Running self-check items against outputs gives a machine-verifiable quality signal without needing human judgment for every test.

## Quality Thresholds

| Score range | Label | Meaning |
|---|---|---|
| 8–40 (all D1–D8 at max) | Exceptional | KDNA is transforming judgment; domain is highly effective |
| 6–7 | Effective | Clear improvement over baseline; domain is working |
| 4–5 | Marginal | Some improvement but not consistently across dimensions |
| 1–3 | Ineffective | KDNA is not changing reasoning trajectory; domain needs revision |

## When a Domain Fails Evaluation

If a domain consistently scores below 5:

1. Check if the axioms are too vague to guide reasoning.
2. Check if the misunderstandings are too generic to detect.
3. Check if the self-check items are answerable with yes/no.
4. Check if the banned terms actually appear in agent outputs.
5. Consider whether the domain boundary is too broad — narrow it.

A domain that cannot be evaluated is not a domain — it's a document.

## Roadmap

| Phase | What |
|---|---|
| Now | Add 3 test cases per domain in `evals/` directory |
| Soon | Script that runs the same prompt with/without KDNA and diffs the output |
| Later | Integrate self-check items into automated scoring |
| Future | Community-contributed eval sets for new domains |
