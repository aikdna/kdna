# RFC-0010: KDNA Fidelity Protocol

> Draft evaluation RFC. Fidelity results may become release evidence, but they
> are not part of KDNA Core format validity or the current first-run path.

**Status:** Draft  
**Proposed:** 2026-06-08  
**Authors:** KDNA Maintainers  
**Related:** RFC-0012 (Artifact Contract), KDNA SPEC 1.0-rc §3.3.2 (Quality Badges), §9 (Validation)

---

## Abstract

KDNA's current quality system measures structural validity (schema conformance, governance field presence, eval case coverage) and output quality (diagnostic depth, terminology consistency, axiom alignment). Neither measures whether domain judgment actually **transferred into the output** — whether the agent internalized the axioms or merely quoted them, whether KDNA meaningfully changed the output beyond what a best-practice prompt would produce, and whether the judgment survived through to the final artifact.

This RFC proposes the **KDNA Fidelity Protocol**: a standardized method for measuring judgment transfer fidelity. It defines three measurement axes (triggered, changed, reached artifact), a multi-task blind comparison design with calibration anchors, per-axiom transfer levels, and cross-model consistency testing.

The Fidelity Protocol produces a Fidelity Result (`fidelity-result.schema.json`), which can be wrapped as an Artifact (per RFC-0012) for storage, review, and registry linkage.

---

## 1. Motivation

### 1.1 What today's quality system measures

| System | Measures | Question Answered |
|--------|----------|-------------------|
| `kdna validate` | JSON schema conformance | Is this a valid .kdna file? |
| `kdna verify --trust` | Signature, digest, revocation | Is this the right file from the right source? |
| `kdna verify --judgment` | Governance field coverage (7 checks) | Are the required fields present? |
| `kdna compare` | A/B output diff + scoring (D1-D8) | Is KDNA output better than no-KDNA output? |
| Eval cases (`evals/`) | Classification accuracy, rubric match | Does the agent classify inputs correctly? |
| Quality badges | Eval case count + review evidence | How much testing has this domain undergone? |
| WorkPack review gates | pass/redo/block/human_review | Does this run meet the gate criteria? |

### 1.2 What none of these measure

None of the existing systems answer a fundamental question:

**"Did the KDNA domain's judgment actually enter the agent's reasoning and persist into the final output?"**

An agent can:
- Quote axioms verbatim without applying them (high terminology score, low fidelity)
- Produce a "better" output by D1-D8 scoring without following KDNA boundaries (high quality, low fidelity)
- Apply KDNA in early-stage prompts but lose it by the final artifact (high intermediate fidelity, low artifact fidelity)
- Pass all eval cases on trained inputs but fail on novel variations (high test coverage, low generalization fidelity)

### 1.3 What fidelity measures

Fidelity answers three questions:

| Question | What it tests | Failure mode |
|----------|---------------|--------------|
| **Triggered?** | Did the trace record axiom activation, boundary enforcement, risk_model checks, self_check execution? | KDNA loaded but ignored — axioms present in prompt but never triggered in reasoning |
| **Changed?** | In a blind A/B/C comparison (no_kdna vs best_prompt vs kdna), does a blinded evaluator consistently identify KDNA output as different AND better along judgment-specific axes? | KDNA output same as best prompt — domain adds no judgment beyond what a good prompt already provides |
| **Reached artifact?** | Does the final artifact (per RFC-0009 ArtifactEnvelope) show evidence of KDNA judgment in its content, not just in intermediate prompts or traces? | Judgment present in generation trace but absent in deliverable — the artifact lost the judgment |

---

## 2. Design

### 2.1 Measurement Architecture

```
Target Artifact (RFC-0009)
    │
    ├── source_kdna[] ──► Which domains are being measured
    ├── trace_refs[]  ──► Which traces document the generation
    └── content       ──► What was actually produced
            │
            ▼
    Fidelity Measurement Run
            │
            ├── Per-Axiom Transfer Analysis
            ├── Multi-Task Blind Comparison
            ├── Calibration Anchor Verification
            ├── Cross-Model Consistency (optional)
            └── Per-Dimension Scoring
                    │
                    ▼
            Fidelity Result (this schema)
                    │
                    ▼
            Fidelity Report Artifact (RFC-0009 envelope)
```

### 2.2 Three Fidelity Dimensions (Core)

Every fidelity measurement MUST report at least these three dimensions:

| Dimension | Weight | What it measures | Evidence |
|-----------|--------|-----------------|----------|
| **judgment_activation** | 0.35 | Whether axioms, boundaries, and risk models were activated in the generation trace | Trace records showing axiom/framework/misunderstanding/self_check entries triggered during generation |
| **judgment_differentiation** | 0.35 | Whether KDNA produces measurably different output from best-prompt baseline | Blind A/B/C comparison delta between kdna and best_prompt conditions |
| **judgment_artifact_presence** | 0.30 | Whether KDNA judgment is detectable in the final artifact content | Content analysis for: preferred terminology used, banned terms avoided, axiom logic traceable in output structure, boundary respect evident |

Optional additional dimensions:

| Dimension | When to include |
|-----------|----------------|
| **cross_model_stability** | When measuring across 2+ models |
| **novel_scenario_generalization** | When eval includes adversarial/novel tasks |
| **misunderstanding_resistance** | When domain has misunderstanding entries |
| **self_check_compliance** | When domain has self_check entries |
| **human_agreement** | When human expert review is available |

### 2.3 Per-Axiom Transfer Levels

Each axiom in the domain is classified into one of five transfer levels:

| Level | Meaning | Score range |
|-------|---------|-------------|
| **operationalized** | Axiom shapes decisions. Output structure reflects axiom logic without quoting it. | 0.80 – 1.00 |
| **referenced** | Axiom is cited and applied. Output references the principle and acts on it. | 0.60 – 0.79 |
| **mentioned** | Axiom appears in output but as ornament — quoted without operational effect. | 0.30 – 0.59 |
| **absent** | Axiom not detected in trace or output. | 0.00 – 0.29 |
| **contradicted** | Output conflicts with the axiom. Agent explicitly or implicitly rejected the judgment. | 0.00 (hard fail) |

A domain with all axioms at `operationalized` or `referenced` has high fidelity. A domain with axioms at `mentioned` or `absent` has structural transfer failure. Any `contradicted` axiom is a critical fidelity failure requiring investigation.

### 2.4 Blind Comparison Design

The comparison uses three conditions:

| Condition | Prompt | Purpose |
|-----------|--------|---------|
| **A: no_kdna** | Standard system prompt ("You are a helpful assistant.") | Baseline: model without any judgment guidance |
| **B: best_prompt** | Optimized prompt written by a domain expert without KDNA format | Control: best achievable result without KDNA protocol |
| **C: kdna_loaded** | Standard system prompt + KDNA domain loaded via kdna load --as=prompt | Treatment: KDNA-governed generation |

**Blind procedure:**
1. Generate outputs for all three conditions using the same model, temperature, and input
2. Shuffle condition labels randomly (A/B/C order unknown to evaluator)
3. An independent evaluator model (different from the generator model) scores each output on fidelity dimensions
4. Unshuffle labels to reveal which condition produced which score
5. Compute `blind_delta = score(kdna) - score(best_prompt)`

**Interpretation:**
- `blind_delta > 0.10`: KDNA provides measurable judgment value beyond best prompt
- `0 ≤ blind_delta ≤ 0.10`: Marginal improvement — KDNA may add value but effect is small
- `blind_delta < 0`: KDNA underperforms best prompt — domain needs revision

### 2.5 Calibration Anchors

Every fidelity run MUST include two calibration anchors to verify the measurement system itself is working:

| Anchor | Input type | Expected | Failure means |
|--------|-----------|----------|---------------|
| **positive** | Core scenario the domain is explicitly designed for | High fidelity (score ≥ 0.80) | Domain is not fit for its stated purpose |
| **negative** | Scenario the domain explicitly does NOT apply to (`does_not_apply_when`) | Low fidelity (score ≤ 0.30) | Measurement is over-attributing — false positives |

If either anchor fails, the entire fidelity result is marked with `calibration_valid: false` and must not be trusted.

### 2.6 Multi-Task Evaluation

Fidelity is measured across multiple task types, not a single input:

| Task Type | Minimum | Purpose |
|-----------|---------|---------|
| `core_scenario` | 2 | Normal application — the domain's intended use |
| `boundary_scenario` | 1 | Domain does not apply — test negative signal accuracy |
| `failure_scenario` | 1 | Misunderstanding triggered — test error detection |
| `novel_scenario` | 1 | Unseen variation — test generalization |
| `adversarial_scenario` | 0 (optional) | Designed to confuse — test robustness |

Minimum 5 tasks per fidelity run. More tasks = higher statistical confidence.

---

## 3. Relationship to KDNA Quality Badges

The Fidelity Protocol extends — but does not replace — the existing quality badge system.

### 3.1 Current badge requirements (from SPEC §3.3.2)

| Badge | Eval Cases | Scoring | Fidelity Required? |
|-------|-----------|---------|-------------------|
| `untested` | 0 | Schema only | No |
| `tested` | ≥10 | Manual verification | No |
| `validated` | ≥30 | Automated scoring | **Proposed: yes** |
| `expert_reviewed` | ≥30 | External expert + fidelity | **Proposed: yes** |
| `production_ready` | ≥30 | Deployment + fidelity | **Proposed: yes** |

### 3.2 Proposed: Fidelity as a prerequisite for validated+

Under this RFC, domains seeking `validated`, `expert_reviewed`, or `production_ready` badges would need:
1. A fidelity run with `overall_score ≥ 0.70` and `passed: true`
2. `calibration_valid: true`
3. `blind_delta > 0` (KDNA outperforms best prompt)
4. No axioms at `contradicted` level
5. The Fidelity Report artifact registered alongside the domain's eval artifacts

This does NOT change the existing badge definitions in SPEC — it adds an optional fidelity dimension that badge issuers MAY require. The registry trust gate MAY enforce fidelity as a gating condition for promotion to `validated` and above.

### 3.3 Relationship to `kdna verify --judgment`

`kdna verify --judgment` remains the structural governance check. Fidelity is the behavioral transfer check. They are complementary:

| Check | Type | Automated? |
|-------|------|-----------|
| `verify --judgment` | Structural — are the right fields present? | Yes, CLI |
| Fidelity Protocol | Behavioral — did judgment transfer? | Yes, via fidelity engine + LLM evaluator |

---

## 4. Relationship to Artifact Contract (RFC-0009)

The Fidelity Result itself is wrapped as an Artifact per RFC-0009:

```json
{
  "artifact_id": "fidelity_run_001",
  "artifact_type": "fidelity_result",
  "schema_version": "1.0.0",
  "source_kdna": [{ "name": "@aikdna/writing", "role": "primary" }],
  "source_artifacts": [
    {
      "artifact_id": "pilot_lesson_001",
      "artifact_type": "pilot_lesson_package",
      "relationship": "evaluation_target"
    }
  ],
  "content": { /* fidelity-result.schema.json content */ },
  "quality": {
    "fidelity": { "score": 0.85, "protocol_version": "1.0.0" }
  }
}
```

The measured artifact references the fidelity result in its own `quality.fidelity` field:

```json
{
  "artifact_type": "pilot_lesson_package",
  "quality": {
    "fidelity": {
      "score": 0.85,
      "protocol_version": "1.0.0",
      "report_artifact_id": "fidelity_run_001"
    }
  }
}
```

This bidirectional linkage enables:
- "Show me fidelity results for artifact X"
- "Show me all artifacts with fidelity < 0.7"
- "Did this domain's fidelity degrade between versions?"

---

## 5. Non-Goals

- **Not a replacement for eval cases.** Eval cases test classification accuracy; fidelity tests judgment transfer. Both are needed.
- **Not a replacement for `kdna compare`.** Compare shows A/B diff; fidelity quantifies transfer with blind controls and calibration.
- **Not a replacement for human expert review.** Expert review evaluates domain content; fidelity evaluates transfer effectiveness.
- **Not an automated quality badge issuer.** Fidelity is evidence for badge promotion, not an automatic badge grant.
- **Not a one-shot measurement.** Fidelity should be measured per-version, per-model, and tracked over time.

---

## 6. Measurement Quality Requirements

To produce trustworthy fidelity results, a measurement run MUST satisfy:

1. **Evaluator model independence:** The model scoring fidelity MUST differ from the model that generated the artifact. Self-evaluation inflates scores.
2. **Blind labeling:** Condition labels MUST be shuffled. The evaluator MUST NOT know which condition produced which output.
3. **Calibration anchor pass:** Both positive and negative anchors MUST pass. `calibration_valid: true` is required.
4. **Minimum task count:** At least 5 tasks covering core, boundary, failure, and novel scenarios.
5. **Temperature consistency:** All conditions in a comparison MUST use the same temperature and generation parameters.
6. **Trace completeness:** Generation traces MUST include axiom activation, self-check results, and boundary enforcement events. Incomplete traces produce unreliable fidelity scores.

---

## 7. Implementation Path

### Phase 1: Fidelity Schema and Spec
- Merge `fidelity-result.schema.json` and this RFC into kdna spec
- Add fidelity measurement concepts to evaluation docs

### Phase 2: Reference Implementation
- Extract `@assay/fidelity-core` from assay's existing fidelity protocol 2.1
- Publish as open-source reference under KDNA ecosystem
- Implement blind A/B/C comparison with calibration anchors
- Support configurable evaluator models

### Phase 3: CLI Integration
- `kdna fidelity measure <artifact> --domain <name>` — run fidelity measurement
- `kdna fidelity report <run_id>` — display fidelity report
- `kdna fidelity compare <domain>@0.1.0 <domain>@0.2.0` — compare fidelity across domain versions

### Phase 4: Registry Integration
- Fidelity results as registry-linked artifacts
- Quality badge promotion gates with fidelity thresholds
- Public fidelity leaderboard for domains

### Phase 5: Continuous Fidelity
- Automated fidelity re-measurement on domain version bumps
- Fidelity regression detection (alert when new version degrades)
- Cross-model fidelity benchmarks

---

## 8. Example: Minimal Valid Fidelity Result

```json
{
  "fidelity_id": "fid_20260608_001",
  "protocol_version": "1.0.0",
  "target_artifact": {
    "artifact_id": "pilot_lesson_001",
    "artifact_type": "pilot_lesson_package",
    "generator": { "engine": "course-engine", "version": "0.3.0" }
  },
  "source_kdna": [
    { "name": "@aikdna/writing", "version": "0.7.2", "role": "primary" }
  ],
  "overall_score": 0.85,
  "pass_threshold": 0.70,
  "passed": true,
  "dimensions": [
    {
      "dimension_id": "judgment_activation",
      "dimension_name": "Judgment Activation",
      "score": 0.90,
      "weight": 0.35,
      "evidence": [
        { "claim": "Axiom 'diagnose_before_polish' triggered in generation trace", "verdict": "confirmed", "detail": "Trace shows axiom triggered at step 3 with match on input classification" },
        { "claim": "Self-check 'structural_vs_cosmetic' passed in postvalidate", "verdict": "confirmed", "detail": "Postvalidate shows pass with reason: diagnosis is structural" }
      ]
    },
    {
      "dimension_id": "judgment_differentiation",
      "dimension_name": "Judgment Differentiation",
      "score": 0.82,
      "weight": 0.35,
      "evidence": [
        { "claim": "KDNA output structurally differs from best_prompt output", "verdict": "confirmed", "detail": "Blind evaluator identified KDNA output as different in 4/5 tasks" }
      ]
    },
    {
      "dimension_id": "judgment_artifact_presence",
      "dimension_name": "Artifact Presence",
      "score": 0.83,
      "weight": 0.30,
      "evidence": [
        { "claim": "Banned term 'polish' not found in artifact", "verdict": "confirmed", "detail": "Preferred term 'refine' used consistently" },
        { "claim": "Artifact structure follows diagnostic-before-prescriptive pattern", "verdict": "confirmed", "detail": "Artifact sections: Diagnosis → Structural Analysis → Prescription" }
      ]
    }
  ],
  "per_axiom": [
    { "axiom_id": "diagnose_before_polish", "domain": "@aikdna/writing", "score": 0.92, "transfer_level": "operationalized", "evidence": "Artifact opens with structural diagnosis section before any prescriptive content" },
    { "axiom_id": "audience_before_prose", "domain": "@aikdna/writing", "score": 0.78, "transfer_level": "referenced", "evidence": "Audience analysis present but not the primary organizing principle" },
    { "axiom_id": "evidence_density_matters", "domain": "@aikdna/writing", "score": 0.65, "transfer_level": "referenced", "evidence": "Evidence check present but applied inconsistently across sections" }
  ],
  "comparison": {
    "conditions": [
      { "condition_id": "A", "condition_type": "no_kdna", "model": "claude-sonnet-4-5", "score": 0.35 },
      { "condition_id": "B", "condition_type": "best_prompt", "model": "claude-sonnet-4-5", "score": 0.62 },
      { "condition_id": "C", "condition_type": "kdna_loaded", "model": "claude-sonnet-4-5", "score": 0.85, "judgment_delta": 0.50 }
    ],
    "blind_delta": 0.23,
    "blind_design": "a_b_c_shuffled",
    "evaluator_model": "gpt-4o",
    "evaluator_rubric": "Rate each output on: (1) diagnostic depth — does it diagnose before prescribing? (2) structural awareness — does it distinguish structure from prose? (3) evidence orientation — does it reference specific evidence?"
  },
  "calibration": {
    "positive_anchor": { "expected_score_min": 0.80, "actual_score": 0.88, "passed": true },
    "negative_anchor": { "expected_score_max": 0.30, "actual_score": 0.15, "passed": true },
    "calibration_valid": true
  },
  "tasks": [
    { "task_id": "core_001", "task_type": "core_scenario", "input_summary": "Article with weak argument structure", "expected_axioms": ["diagnose_before_polish"], "task_score": 0.90 },
    { "task_id": "core_002", "task_type": "core_scenario", "input_summary": "Content with undefined audience", "expected_axioms": ["audience_before_prose"], "task_score": 0.85 },
    { "task_id": "boundary_001", "task_type": "boundary_scenario", "input_summary": "Grammar check request only", "expected_axioms": [], "task_score": 0.88 },
    { "task_id": "failure_001", "task_type": "failure_scenario", "input_summary": "Content where author insists on polish-only", "expected_misunderstandings_avoided": ["polish_is_sufficient"], "task_score": 0.82 },
    { "task_id": "novel_001", "task_type": "novel_scenario", "input_summary": "Technical documentation with structural issues", "expected_axioms": ["diagnose_before_polish"], "task_score": 0.80 }
  ],
  "trace_refs": [
    { "trace_id": "trace_gen_001", "trace_type": "generation" },
    { "trace_id": "trace_post_001", "trace_type": "postvalidate" }
  ],
  "completed_at": "2026-06-08T11:00:00Z",
  "evaluator": { "engine": "fidelity-engine", "version": "0.1.0" }
}
```

---

## 9. Questions for Review

1. Should `blind_delta` use `kdna - best_prompt` or `kdna - no_kdna`? Current choice: `kdna - best_prompt` because the key question is "does KDNA add value beyond what a good prompt already provides?" Using `no_kdna` as baseline inflates the delta artificially.

2. Should cross-model testing be required or optional? Current choice: optional. It is valuable but expensive (N models × 3 conditions × M tasks).

3. Should fidelity be measured per-artifact or per-domain-version? Current design supports both: per-artifact (measure a specific generated output) and per-domain-version (aggregate across multiple artifacts). Per-artifact is more actionable; per-version is more suitable for badge/registry purposes.

4. Should the Fidelity Protocol define a minimum evaluator model capability level? Not in the current contract. The protocol is model-agnostic. However, measurement quality warnings should flag when the evaluator model is low-capability or same as generator.

5. How should fidelity handle KDNA clusters (multiple domains composed)? Each domain in the cluster gets its own per-axiom transfer measurement. Cross-domain interactions (conflicts, overrides) may produce fidelity effects not captured by single-domain measurement. Cluster fidelity is a separate, more complex measurement that should be addressed in a future RFC.

---

## Appendix A: Schema File

- `specs/fidelity-result.schema.json` — Fidelity Result schema
