#!/usr/bin/env bash
# Runs node:test with the right flags for Node 18/22/24.
# Node 18 requires --experimental-test-runner; Node 22+ does not.
set -euo pipefail

TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")

if [ "$MAJOR" -le 18 ]; then
  node --experimental-test-runner --test "$TEST_DIR"/*.test.js
else
  node --test "$TEST_DIR"/*.test.js
fi
