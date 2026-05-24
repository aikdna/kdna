# KDNA Quality Badge Evidence Gate

Version: 0.1
Status: Draft
Depends on: kdna-asset-card.md, benchmark design docs, registry SCHEMA.md v2.3

## 1. Purpose

Define the evidence requirements for each quality badge level. A domain cannot advance to a higher badge without satisfying the evidence gate. This prevents "badge inflation" where domains claim quality levels without measurable proof.

## 2. Badge Levels & Evidence Requirements

### untested → tested

| Requirement | Threshold | Evidence |
|-------------|-----------|----------|
| Test cases exist | ≥ 1 eval case | `test_count` ≥ 1 in registry |
| Test runner available | Runnable by third party | Eval script in domain repo |
| Test specification | Anyone can understand what's being tested | test description + expected results per case |

**Gate check**: `test_count >= 1` AND eval script is present in domain repo.

### tested → validated

| Requirement | Threshold | Evidence |
|-------------|-----------|----------|
| Comparison report | No KDNA vs KDNA with raw outputs | Public URL to benchmark report |
| Model version declared | Which model(s) were used | `evaluation_history[].metrics.model` |
| Test count sufficient | ≥ 10 cases | `test_count` ≥ 10 |
| Failure cases published | Not just cherry-picked wins | `failure_cases_published: true` in Asset Card |
| Raw outputs accessible | Independent verification | `raw_outputs_url` in Asset Card |
| Rubric defined | Scoring criteria are public | Rubric in benchmark design doc |

**Gate check**: All 6 requirements met. At least 1 `evaluation_history` entry with valid `eval_score`.

### validated → expert_reviewed

| Requirement | Threshold | Evidence |
|-------------|-----------|----------|
| External review | ≥ 1 independent domain expert | `reviewed_by` field populated |
| Review scope | Covers axioms, boundaries, failure_risks, does_not_apply_when | Review summary linked |
| Review findings public | Transparent about limitations | `review_summary_url` or `known_limitations_url` |
| Inter-rater check | At least 30 cases reviewed by 2+ reviewers | Blind review data available |
| Consensus metric | Fleiss' Kappa ≥ 0.6 or agreement ≥ 80% | Reported in review |

**Gate check**: `reviewed_by` non-empty AND review evidence publicly linked.

### expert_reviewed → production_ready

| Requirement | Threshold | Evidence |
|-------------|-----------|----------|
| Production deployment | Used in ≥ 1 real system for ≥ 30 days | `production_deployment` declaration |
| Outcome data | Actual performance data (not just benchmarks) | `outcome_records_url` or internal audit |
| Regression tests | ≥ 30 automated eval cases | `test_count` ≥ 30 |
| Incident history | Any failures documented | `known_limitations.md` updated with production incidents |
| Update stability | ≥ 2 versions without breaking judgment | Version history with judgment_version consistency |
| Support responsiveness | Issues addressed within SLA | Response time metrics |

**Gate check**: `test_count >= 30` AND `production_deployment` declaration AND at least 2 `evaluation_history` entries showing stability.

## 3. Gate Enforcement

### 3.1 Registry CI Enforcement

```yaml
# .github/workflows/quality-gate.yml
on:
  pull_request:
    paths:
      - 'domains.json'

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check badge evidence
        run: node scripts/check-quality-gate.js
```

### 3.2 Badge Promotion Validation

```
kdna badge promote @aikdna/writing --to validated

Pre-flight checks:
  ✅ test_count = 30 (>= 10)
  ✅ comparison_report_url = https://...
  ✅ raw_outputs_url = https://...
  ✅ failure_cases_published = true
  ✅ model_versions_tested = ["claude-3-5-sonnet-20241022"]
  ✅ evaluation_history has 1 entry

  → Badge promoted to "validated". Evidence recorded in evaluation_history.
```

### 3.3 Badge Demotion

Badges can be demoted if:
1. A benchmark regression shows score decrease > 10% from last known good version
2. A safety incident is reported and confirmed
3. The domain has been unmaintained (no updates for > 6 months) while spec version advanced

Demotion triggers a CI warning and requires maintainer acknowledgment.

## 4. Evidence Preservation

### 4.1 Immutable Evidence Chain

Each badge promotion creates an immutable entry in `evaluation_history`:

```json
{
  "badge": "validated",
  "promoted_at": "2026-05-24T14:00:00Z",
  "promoted_by": "kdna-team",
  "evidence": {
    "test_count": 30,
    "benchmark_id": "agent_safety-100-case-v1",
    "comparison_report_url": "https://...",
    "raw_outputs_url": "https://...",
    "failure_cases_published": true,
    "model_versions_tested": ["claude-sonnet-4-6-20250514"],
    "reviewed_by": "external-expert-id",
    "review_date": "2026-05-20"
  }
}
```

### 4.2 Public Evidence Repository

A `benchmarks/` directory in each domain repo preserves:
- Raw model outputs (JSONL)
- Comparison reports (Markdown)
- Scoring scripts (reproducible)
- Failure case annotations

## 5. Quality Badge Display

### 5.1 Registry Badge

| Badge | Icon | Display |
|-------|------|---------|
| `untested` | ⚪ | No evidence available |
| `tested` | 🟡 | Basic testing done (≥1 case) |
| `validated` | 🟢 | Benchmarked with public evidence |
| `expert_reviewed` | 🔵 | Independently reviewed by domain expert |
| `production_ready` | 🟣 | Used in production with outcome data |

### 5.2 Asset Card

The Asset Card's `evidence` block shows:
- Current badge + promotion date
- Eval score + trend (↑/↓ vs previous version)
- Test count
- Link to latest comparison report
- Link to raw outputs
- Whether failure cases are published

## 6. Badge Governance

### 6.1 Promotion Authority

| From | To | Authority |
|------|----|-----------|
| `untested` | `tested` | Domain author (self-serve) |
| `tested` | `validated` | Registry maintainer OR CI auto-check |
| `validated` | `expert_reviewed` | Registry maintainer + external reviewer |
| `expert_reviewed` | `production_ready` | Registry governance board |

### 6.2 Dispute Resolution

If a badge is contested:
1. Open an issue with `quality-badge-dispute` label
2. Provide counter-evidence (alternative benchmark, review)
3. Governance board reviews within 14 days
4. Decision is public with rationale

---

*This specification operationalizes the quality badge system defined in kdna-registry/SCHEMA.md and is enforced by CI checks in kdna-registry/.github/workflows/.*
