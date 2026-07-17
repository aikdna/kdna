# Reference Domain Eval Expansion Plan

> **Status: Historical.** This pre-Core plan targeted protocol quality badges
> and registry promotion. It is not an active Core roadmap. Future evaluation
> results must remain issuer-scoped external assessments and cannot create Core
> quality or promotion levels.

Goal: upgrade 3 core reference domains from `tested` (10-15 evals) to `validated` (30+ evals with automated scoring, raw outputs, and benchmark reports).

## Current State

| Domain | Quality | Evals | Automated Scoring | Raw Outputs | Benchmark Report |
|--------|---------|-------|:---:|:---:|:---:|
| @aikdna/writing | tested | 15 | No | No | No |
| @aikdna/prompt_diagnosis | tested | 10 | No | No | No |
| @aikdna/agent_safety | tested | 10 | No | No | No |

## Target State

| Domain | Quality | Evals | Scoring | Raw Outputs | Benchmark Report |
|--------|---------|-------|:---:|:---:|:---:|
| @aikdna/writing | **validated** | 30+ | Yes | Yes | Yes |
| @aikdna/prompt_diagnosis | **validated** | 30+ | Yes | Yes | Yes |
| @aikdna/agent_safety | **validated** | 30+ | Yes | Yes | Yes |

## Universal Eval Script Template

Each domain should have an `evals/run.mjs` that:

1. Loads the domain via `@aikdna/kdna-core`
2. Reads eval cases from `evals/cases/*.json`
3. Sends each case to the provider twice (No KDNA, With KDNA)
4. Scores output against defined rubrics
5. Saves raw outputs in `evals/raw/`
6. Generates `evals/BENCHMARK_REPORT.md`

### Script Template

```javascript
// evals/run.mjs
import { loadKDNA, renderForAgent } from '@aikdna/kdna-core';
import fs from 'node:fs';
import path from 'node:path';

const domain = loadKDNA('.');
const kdnaContext = renderForAgent('.');
const casesDir = path.join(import.meta.dirname, 'cases');
const rawDir = path.join(import.meta.dirname, 'raw');
fs.mkdirSync(rawDir, { recursive: true });

const cases = fs.readdirSync(casesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(casesDir, f), 'utf8')));

const results = [];

for (const c of cases) {
  // 1. Run WITHOUT KDNA
  const noKdna = await callProvider(c.input, null);
  
  // 2. Run WITH KDNA
  const withKdna = await callProvider(c.input, kdnaContext);
  
  // 3. Score both
  const noScore = scoreResponse(noKdna, c.rubric);
  const withScore = scoreResponse(withKdna, c.rubric);
  
  // 4. Save raw outputs
  fs.writeFileSync(path.join(rawDir, `${c.id}.json`), JSON.stringify({
    id: c.id, input: c.input,
    no_kdna: { response: noKdna, score: noScore },
    with_kdna: { response: withKdna, score: withScore },
  }, null, 2));

  results.push({ id: c.id, noScore, withScore, delta: withScore - noScore });
}

// 5. Generate report
const avgNo = results.reduce((s,r) => s + r.noScore, 0) / results.length;
const avgWith = results.reduce((s,r) => s + r.withScore, 0) / results.length;

console.log(`No KDNA: ${avgNo.toFixed(1)} | With KDNA: ${avgWith.toFixed(1)} | Δ: +${(avgWith - avgNo).toFixed(1)}`);
```

## Eval Case Format

```json
{
  "id": "eval_001",
  "category": "structural_diagnosis",
  "input": "Help me improve this product launch post: 'AI is transforming our industry. Our product uses AI to help you work faster. Get it now.'",
  "expected_behavior": "Agent diagnoses structural problems before suggesting language changes. Identifies missing argument, cognitive hook, and evidence.",
  "rubric": {
    "structural_diagnosis": { "weight": 4, "criteria": ["identifies problem type", "diagnoses before polishing"] },
    "argument_identification": { "weight": 3, "criteria": ["identifies missing claim", "distinguishes claim from assertion"] },
    "hook_detection": { "weight": 2, "criteria": ["detects missing cognitive tension", "does not confuse context for hook"] },
    "evidence_assessment": { "weight": 1, "criteria": ["checks evidence density", "distinguishes evidence from explanation"] }
  }
}
```

## Eval Case Distribution per Domain

### @aikdna/writing (expand 15 → 30)

| Category | Existing | New | Target |
|----------|:--:|:--:|:--:|
| Structural diagnosis vs language polish | 5 | 3 | 8 |
| Argument/hook detection | 3 | 3 | 6 |
| Evidence density assessment | 3 | 2 | 5 |
| Banned term avoidance | 2 | 2 | 4 |
| Context-appropriate editing | 1 | 3 | 4 |
| False positive (should NOT diagnose structure) | 1 | 2 | 3 |

### @aikdna/prompt_diagnosis (expand 10 → 30)

| Category | Existing | New | Target |
|----------|:--:|:--:|:--:|
| Task mixing detection | 3 | 4 | 7 |
| Goal ambiguity detection | 2 | 4 | 6 |
| Context gap identification | 2 | 3 | 5 |
| False format fix rejection | 1 | 3 | 4 |
| Substance-wrong-but-format-correct | 1 | 3 | 4 |
| Triage framework application | 1 | 3 | 4 |

### @aikdna/agent_safety (expand 10 → 30)

| Category | Existing | New | Target |
|----------|:--:|:--:|:--:|
| Irreversibility detection | 3 | 4 | 7 |
| Authorization scope verification | 2 | 3 | 5 |
| Recommend vs execute decision | 2 | 3 | 5 |
| Backup/recovery assessment | 1 | 3 | 4 |
| False positive (should NOT gate) | 1 | 2 | 3 |
| Multi-domain composition (safety + other domain) | 1 | 5 | 6 |

## Success Criteria for "validated" quality badge

Per domain:

- [ ] 30+ eval cases in `evals/cases/`
- [ ] `evals/run.mjs` produces automated scoring
- [ ] Raw model outputs saved in `evals/raw/` 
- [ ] `evals/BENCHMARK_REPORT.md` describes methodology, models used, results, limitations
- [ ] `quality_badge: "validated"` in `kdna.json`
- [ ] `test_count: 30` (or higher) in domain metadata
- [ ] `benchmark_report_url` pointing to public report
- [ ] Trust gate: `scripts/check-domain-trust-gate.js` passes
- [ ] Registry entry updated with new quality badge

## Phase Execution

Phase 1: @aikdna/writing (highest external visibility)  
Phase 2: @aikdna/prompt_diagnosis (clearest KDNA value prop)  
Phase 3: @aikdna/agent_safety (strongest safety narrative)
