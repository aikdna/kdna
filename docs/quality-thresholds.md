# KDNA Quality Thresholds

> **Status: Historical.** This document describes pre-Core quality evaluation processes.
> For current asset creation, see `OPEN/kdna-assets/` (public) and the asset authoring workflow in `kdna-studio-cli`.

Not every structurally valid KDNA domain deserves publication. This document defines what quality means at each level — and what evidence is required to advance.

## Quality Levels

| Level | Badge | Meaning | Required Evidence |
|-------|-------|---------|------------------|
| 0. `untested` | None | Structurally valid, no judgment evidence | lint + validate pass |
| 1. `tested` | >= 10 eval cases | Manually verified test coverage | evals + clear expected judgment |
| 2. `validated` | >= 30 eval cases | Measurably improves judgment | benchmark report, rubric, raw outputs |
| 3. `expert_reviewed` | >= 30 eval cases | Independently verified | validated + external domain expert review |
| 4. `production_ready` | >= 30 eval cases | Battle-tested | expert_reviewed + 30+ days real-world use, outcome data, no regressions |

---

## `untested` Gate: Structural Validity

### Gate: Structural Validity

```bash
kdna-lint my_domain    # Must pass with 0 warnings
kdna-validate my_domain # Must pass
```

### Anti-Vagueness Check

Every field must be non-trivial. The following are REJECTED:

| Field | Rejected Pattern | Minimum Standard |
|-------|-----------------|-----------------|
| `axioms[].one_sentence` | "Trust is important." | Must describe a specific judgment: "Price objections are certainty deficits, not price problems." |
| `ontology[].essence` | Dictionary definition | Must describe operational meaning in this domain |
| `ontology[].boundary` | Negation only ("Not distrust") | Must name a specific concept it is often confused with |
| `stances[]` | "Be helpful." | Must be a prescriptive position that biases agent behavior |
| `self_check[]` | "Is this response good?" | Must be a domain-specific yes/no question |
| `misunderstandings[].wrong` | Straw man no one believes | Must describe a belief a real agent might hold |

---

## `tested` Gate: Manual Eval Coverage

### Gate: Content Completeness + 10 Eval Cases

- [ ] At least 2 axioms, each with `one_sentence`, `full_statement`, `why`
- [ ] At least 2 ontology concepts, each with `essence`, `boundary`, `trigger_signal`
- [ ] At least 1 framework with named steps
- [ ] At least 2 stances
- [ ] At least 5 banned terms with `why` and `replace_with`
- [ ] At least 3 misunderstandings with `key_distinction` and `why`
- [ ] At least 3 self-checks (yes/no answerable)
- [ ] Anti-vagueness: each field is domain-specific, not a truism
- [ ] `kdna.json` manifest complete (no empty fields)
- [ ] At least 10 eval cases with expected classifications or rubrics
- [ ] Eval cases cover in-scope, boundary, failure, and out-of-scope inputs

---

## `validated` Gate: Measurable Judgment Improvement

### Gate: Measurable Judgment Improvement

Requires a benchmark that proves KDNA-loaded agents judge better than the same model without KDNA.

#### Benchmark Requirements

1. **At least 30 scenarios** covering different difficulty levels
2. **Real model outputs** — not hand-written expected answers
3. **Both conditions**: no-KDNA and with-KDNA outputs from the same model
4. **Raw outputs preserved** in `tests/raw/` or `benchmarks/raw/`
5. **Public report** with:
   - Before/after scores per scenario
   - Failure cases (what KDNA still gets wrong)
   - Model and date used
   - Reproducible eval script

#### Score Threshold

- State/classification accuracy: **≥ 80%** improvement over baseline, OR
- Error reduction: false positives reduced by **≥ 50%**, OR
- Expert judgment: external reviewer confirms **≥ 3/4 scenarios** improved

#### Score Does NOT Advance

- [ ] Hand-written "expected answers" without real model outputs
- [ ] Self-scored without blind rubric
- [ ] No failure cases shown (only cherry-picked wins)
- [ ] Cannot be reproduced by running a script

---

## `expert_reviewed` Gate: Independent Verification

### Gate: Independent Verification

Requires at least ONE external domain expert who:

1. Is not the KDNA author
2. Has verifiable domain expertise (can be linked)
3. Reviews the domain and benchmark using a structured rubric
4. Provides public feedback: what they agree with, what they'd change
5. Their name and credentials are recorded in `registry/domains.json`

#### Reviewer Rubric

| Dimension | Question | Score |
|-----------|----------|:-----:|
| Axiom accuracy | Do the axioms reflect how experts actually judge in this domain? | 0-3 |
| Completeness | Are critical judgment patterns missing? | 0-3 |
| Operational clarity | Can an agent actually apply these rules to text? | 0-3 |
| Safety | Could following these rules cause harm? | 0-3 |
| Overall | Would you use this KDNA in a production agent? | 0-3 |

**Minimum: ≥ 10/15 overall**, with no single dimension scoring 0.

---

## `production_ready` Gate: Real-World Validation

### Gate: Real-World Validation

- [ ] Used in at least one real agent system for **≥ 30 days**
- [ ] **Outcome data recorded**: at least 10 judgment → result pairs
- [ ] No judgment REGRESSION in that period (new version doesn't score lower)
- [ ] User or client confirms: "This KDNA made our agent's judgment better"

---

## Publication Checklist

Before submitting any domain to the registry, verify:

```
[ ] kdna-lint: 0 errors, 0 warnings
[ ] kdna-validate: pass
[ ] Anti-vagueness: every field is domain-specific (not generic advice)
[ ] kdna.json: no empty fields (keywords, author, description, registry)
[ ] LICENSE file present and appropriate
[ ] README.md explains what judgment this domain improves
[ ] If claiming validated: benchmark report + raw outputs + eval script
[ ] If claiming expert_reviewed: reviewer name + credentials + rubric scores
[ ] CHANGELOG entry for this version
```

## Anti-Patterns (Never Publish These)

| Anti-Pattern | Example | Why Rejected |
|-------------|---------|-------------|
| Slogan axiom | "Communication is key." | Does not change agent behavior. |
| Negation-only boundary | "Boundary: Not bad communication." | Does not help agent distinguish. |
| Generic self-check | "Is this helpful?" | Every domain would ask this. |
| Straw-man misunderstanding | "Wrong: communication doesn't matter." | No agent believes this. |
| Dictionary ontology | "Trust: firm belief in reliability." | Copy-pasted from dictionary; not operational. |
| Number padding | 20 axioms, all one-liners | Quantity ≠ quality. 4 sharp axioms > 20 slogans. |
| Cherry-picked benchmark | Only show scenarios where KDNA wins | Benchmark without failure cases is propaganda. |
