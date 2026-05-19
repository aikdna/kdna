# KDNA Benchmarks

Benchmarks measure whether KDNA domains actually improve agent judgment.

## Available Benchmarks

### Decision State Benchmark (`decision-state-benchmark.json`)
- **30 scenarios** covering 4 judgment states: UNRESOLVED, CONDITIONAL, INTENTIONAL_DEFERRAL, EXECUTABLE_DECISION
- **Result**: 96.7% state accuracy with KDNA (vs 90.0% without), zero false actionization errors
- **Report**: `decision-state-comparison-report.md`

### Judgment Benchmark (`judgment-benchmark.json`)
- **5 judgment patterns**, 3 cases each (15 total)
- Tests core KDNA judgment modes: Discussion vs Decision, Request vs Need, Plan vs Feedback Loop, Signal vs Noise, Preference vs Constraint
- Run with: `node src/cli.js eval benchmarks/judgment-benchmark.json --benchmark`

## How to Run

```bash
# One-time eval (requires ANTHROPIC_API_KEY)
node benchmarks/eval-decision-state.js --limit=5

# Full benchmark reproduction
./benchmarks/eval-runner.sh --model=kimi-for-coding --limit=30

# Auto-scoring against expected answers
node src/cli.js eval benchmarks/judgment-benchmark.json --benchmark
```

## Raw Outputs

All raw model outputs are preserved in `benchmarks/raw/` in JSONL format for independent verification.

## Adding New Benchmarks

1. Create a benchmark JSON following the outcome-ready schema (see `decision-state-benchmark.json` for reference)
2. Add expected judgments for each scenario
3. Generate raw outputs with and without KDNA
4. Write a comparison report
5. Add an eval runner script
