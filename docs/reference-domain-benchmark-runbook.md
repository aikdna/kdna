# KDNA Reference Domain Benchmark Runbook

> **Purpose:** Step-by-step instructions to run validated-level benchmarks for KDNA reference domains.
> **Target:** 30+ eval cases, 3 conditions (no_kdna, best_prompt, kdna_full), automated scoring, public report.

## Prerequisites

- Node.js 22+
- kdna CLI installed globally: `npm install -g @aikdna/kdna-cli`
- Domain installed: `kdna install @aikdna/<domain> --yes`
- API key in `../.env` (relative to kdna-lab root):
  ```
  OPENROUTER_API_KEY=sk-or-v1-...
  ```
  Or `MINIMAX_API_KEY`, `SILICONFLOW_API_KEY`, etc.

## Quick Start

```bash
cd kdna-lab

# Dry run (validate everything, no API calls)
node runners/run_domain_benchmark.mjs --domain "@aikdna/writing" --dry-run

# Run 3 cases to verify pipeline
node runners/run_domain_benchmark.mjs --domain "@aikdna/writing" --limit 3

# Full 30-case benchmark
node runners/run_domain_benchmark.mjs --domain "@aikdna/writing"
```

## Per-Domain Commands

### @aikdna/writing (30 cases)

```bash
kdna install @aikdna/writing --yes
node runners/run_domain_benchmark.mjs --domain "@aikdna/writing"
# 90 API calls (30 cases × 3 conditions)
# Output: outputs/benchmarks/writing/
```

### @aikdna/prompt_diagnosis (30 cases)

```bash
kdna install @aikdna/prompt_diagnosis --yes
node runners/run_domain_benchmark.mjs --domain "@aikdna/prompt_diagnosis"
# Output: outputs/benchmarks/prompt_diagnosis/
```

### @aikdna/agent_safety (30 cases)

```bash
kdna install @aikdna/agent_safety --yes
node runners/run_domain_benchmark.mjs --domain "@aikdna/agent_safety"
# Output: outputs/benchmarks/agent_safety/
```

## Using Different Models

```bash
# OpenRouter
node runners/run_domain_benchmark.mjs --domain "@aikdna/writing" --model anthropic/claude-opus-4.7

# SiliconFlow
export SILICONFLOW_API_KEY=sk-...
# (requires config modification or env-based provider selection)
```

## Output Structure

```
outputs/benchmarks/<domain>/
├── benchmark-report.md        # Human-readable benchmark report
├── benchmark-results.json     # Full machine-readable results
└── raw/                       # Raw model outputs
    ├── no_kdna_<caseId>.txt
    ├── best_prompt_<caseId>.txt
    └── kdna_full_<caseId>.txt
```

## Post-Benchmark Checklist

After running benchmarks for a domain:

1. [ ] Review `benchmark-report.md` — check that KDNA outperforms Best Prompt
2. [ ] Spot-check raw outputs for quality
3. [ ] Update `kdna.json` in domain repo:
   ```json
   "quality_badge": "validated",
   "test_count": 30
   ```
4. [ ] Add to domain's `kdna.json`:
   ```json
   "evals_url": "https://github.com/aikdna/kdna-<domain>/tree/main/evals",
   "benchmark_report_url": "https://github.com/aikdna/kdna-lab/blob/main/outputs/benchmarks/<domain>/benchmark-report.md",
   "known_limitations_url": "https://github.com/aikdna/kdna-<domain>/blob/main/docs/known-limitations.md"
   ```
5. [ ] Republish domain with: `kdna publish @aikdna/<domain>`
6. [ ] Update registry entry with new badge + evidence URLs

## Cost Estimate

- 30 cases × 3 conditions × ~1000 tokens output = ~90K tokens per domain
- At OpenRouter DeepSeek V4-Pro pricing (~$0.50/M tokens): ~$0.05 per domain
- With L2 judge (optional, adds 30 more API calls): ~$0.10 per domain
- **Total for 3 domains: ~$0.30**
