# KDNA Compare Report — Design Specification

> **Status:** Implemented. `kdna compare` available in `@aikdna/kdna-cli`.
> Historical benchmark artifacts are not part of the current public beta
> repository.

## Overview

`kdna compare` is the easiest way to see KDNA's value. It sends the same input to an LLM with and without a loaded domain, then diffs the judgment paths. The output should be a structured, shareable report.

## Command

```bash
kdna compare @aikdna/writing --input "help me improve this post" [--format json|md|html]
```

## Standard Report Format

### Markdown Output (default)

```markdown
# KDNA Judgement Comparison Report

**Domain:** @aikdna/writing (v0.7.2)  
**Input:** "help me improve this post"  
**Model:** claude-sonnet-4-20250514  
**Date:** 2026-05-23T10:00:00Z  

---

## Without KDNA

### Judgment Path
1. Interpreted as a generic writing improvement request
2. Suggested clearer wording, shorter sentences, more enthusiasm
3. No structured diagnosis applied

### Classification
- Type: language polishing
- Risk level: not assessed

### Key Deficiencies
- Did not check for argument presence
- Did not identify structural void
- Suggested surface-level changes only

---

## With KDNA (@aikdna/writing)

### Domain Loaded
- Name: @aikdna/writing
- Axioms applied: 4/4
- Frameworks applied: frame_diagnose_before_fix
- Self-checks passed: 5/5
- Risk flags: none

### Judgment Path
1. Classified as structural writing diagnosis (not language polishing)
2. Checked: Is there a real argument? → No
3. Checked: Is there a cognitive hook? → No
4. Checked: Is there evidence density? → Insufficient
5. Applied framework: diagnose_before_fix (4 steps)
6. Avoided banned terms: "polish the language", "make it punchy", "improve the flow"
7. Used preferred terms: judgment_pressure, cognitive_hook, structural_void, specificity_anchor

### Applied Axioms
- AX-001 (problem_not_prose): Triggered — diagnosed structural issue, not surface language
- AX-002 (judgment_pressure): Triggered — identified lack of judgment pressure
- AX-003 (hook_before_structure): Triggered — hook failure detected before structure issues
- AX-004 (evidence_not_opinion): Not triggered (no assertion claims in input)

### Misunderstandings Avoided
- good_writing_equals_good_thinking: Detected and avoided
- introduction_equals_hook: Detected and avoided
- more_detail_equals_more_evidence: Not relevant

---

## Judgment Diff

| Dimension | Without KDNA | With KDNA | Change |
|-----------|:-----------:|:---------:|:------:|
| **Classification** | Language polishing | Structural diagnosis | **Changed** |
| **Diagnostic depth** | Surface symptoms | Root cause identified | **Improved** |
| **Terminology** | Generic writing advice | Domain-specific terms | **Improved** |
| **Boundary respected** | N/A | Language polishing avoided | **Applied** |
| **Risk avoided** | None | Polish-as-solution avoided | **Avoided** |
| **Self-check pass rate** | 0% | 100% (5/5) | **Improved** |

## Summary

Loading @aikdna/writing changed the agent's classification of the problem from "language polishing" to "structural diagnosis" — a fundamentally different judgment path. The agent diagnosed root causes (missing argument, no cognitive hook) instead of suggesting surface-level wording changes. All 5 domain self-checks passed.
```

### JSON Output

```json
{
  "meta": {
    "domain": "@aikdna/writing",
    "domain_version": "0.7.2",
    "input": "help me improve this post",
    "model": "claude-sonnet-4-20250514",
    "timestamp": "2026-05-23T10:00:00Z"
  },
  "without_kdna": {
    "classification": "language_polishing",
    "path": ["interpret_as_writing_improvement", "suggest_clearer_wording", "suggest_shorter_sentences"],
    "deficiencies": ["no_argument_check", "no_structural_diagnosis", "surface_level_only"]
  },
  "with_kdna": {
    "domain": "@aikdna/writing",
    "classification": "structural_diagnosis",
    "axioms_applied": ["problem_not_prose", "judgment_pressure", "hook_before_structure"],
    "axioms_skipped": ["evidence_not_opinion"],
    "frameworks_applied": ["frame_diagnose_before_fix"],
    "banned_terms_avoided": ["polish the language", "make it punchy", "improve the flow"],
    "preferred_terms_used": ["judgment_pressure", "cognitive_hook", "structural_void"],
    "misunderstandings_detected": ["good_writing_equals_good_thinking", "introduction_equals_hook"],
    "self_checks_passed": 5,
    "self_checks_total": 5,
    "risk_flags": []
  },
  "diff": {
    "classification_changed": true,
    "diagnostic_depth_improved": true,
    "terminology_improved": true,
    "boundary_respected": true,
    "risk_avoided": true
  }
}
```

## Scoring Dimensions

The comparison report evaluates across these dimensions:

| D# | Dimension | Score Range | What Changes |
|----|-----------|:-----------:|-------------|
| D1 | Diagnostic depth | 0-10 | Surface symptoms → Root cause |
| D2 | Terminology precision | 0-10 | Generic → Domain-specific |
| D3 | Misunderstanding detection | 0-10 | Passed through → Caught |
| D4 | Axiom alignment | 0-10 | Generic reasoning → Axiom-driven |
| D5 | Self-check pass rate | 0-100% | % of domain self-checks satisfied |
| D6 | Boundary respect | Pass/Fail | Did it avoid what it should avoid? |
| D7 | Risk avoidance | Pass/Fail | Were known failure risks avoided? |

## Usage as Communication Asset

The comparison report should be:
1. **Copy-pasteable** — Works as a GitHub comment, Slack message, or tweet
2. **Self-contained** — No need to understand KDNA internals to see the value
3. **Honest** — Reports when KDNA made no difference (doesn't fake improvement)

### Example Tweet

> Same input. Same model. Different judgment.  
> Without KDNA: "polish the language"  
> With @aikdna/writing: "you're missing an argument. here's why that matters before any language fixes."  
> kdna compare @aikdna/writing --input "help me improve this post"
