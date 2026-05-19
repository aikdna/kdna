#!/bin/bash
# KDNA Decision State Benchmark — One-Command Reproduction
# Usage: ./eval-runner.sh [--model MODEL] [--limit N]
#
# Reproduces the no-KDNA / with-KDNA comparison for the decision_state benchmark.

set -euo pipefail

MODEL="${MODEL:-kimi-for-coding}"
LIMIT="${LIMIT:-30}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model) MODEL="$2"; shift 2;;
    --limit) LIMIT="$2"; shift 2;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

echo "=== KDNA Decision State Benchmark Runner ==="
echo "Model: $MODEL"
echo "Limit: $LIMIT scenarios"
echo ""

# Check API key
if [[ -z "${ANTHROPIC_API_KEY:-}${ANTHROPIC_AUTH_TOKEN:-}" ]]; then
  echo "ERROR: ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN must be set"
  exit 1
fi

# Run no-KDNA
echo "[1/2] Running no-KDNA benchmark..."
node eval-decision-state.js --model="$MODEL" --limit="$LIMIT"

# Run with-KDNA
echo ""
echo "[2/2] Running with-KDNA benchmark..."
node eval-decision-state.js --model="$MODEL" --limit="$LIMIT" --kdna

# Find latest raw files
NO_KDNA_FILE=$(ls -t raw/decision-state-no-kdna-*.jsonl | head -1)
WITH_KDNA_FILE=$(ls -t raw/decision-state-with-kdna-*.jsonl | head -1)

echo ""
echo "=== Results ==="
echo "no-KDNA:  $NO_KDNA_FILE"
echo "with-KDNA: $WITH_KDNA_FILE"
echo ""
echo "To generate comparison report:"
echo "  node -e \"require('./eval-decision-state').generateReport('$NO_KDNA_FILE', '$WITH_KDNA_FILE')\""
