#!/usr/bin/env bash
set -euo pipefail

# KDNA Cross-Repo Validator
# Validates all domain repos listed in the registry and tools repos.
# Usage: ./scripts/validate-ecosystem.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TMP_DIR="${TMPDIR:-/tmp}/kdna-ecosystem-check"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "=== KDNA Ecosystem Validator ==="
echo ""

FAILURES=0

# Validate main repo
echo "[1/3] Validating main repo..."
cd "$ROOT_DIR"
if npx kdna-lint examples/communication > /dev/null 2>&1; then
  pass "Main repo: examples/communication passes kdna-lint"
else
  fail "Main repo: examples/communication fails kdna-lint"
  FAILURES=$((FAILURES + 1))
fi

if [ -f "registry/domains.json" ]; then
  if python3 -c "import json; json.load(open('registry/domains.json'))" 2>/dev/null; then
    pass "Main repo: registry/domains.json is valid JSON"
  else
    fail "Main repo: registry/domains.json is invalid JSON"
    FAILURES=$((FAILURES + 1))
  fi
else
  fail "Main repo: registry/domains.json not found"
  FAILURES=$((FAILURES + 1))
fi

if [ -f "SPEC.md" ] && [ -f "README.md" ] && [ -f "README.zh.md" ]; then
  pass "Main repo: core docs present (SPEC.md, README.md, README.zh.md)"
else
  fail "Main repo: missing core docs"
  FAILURES=$((FAILURES + 1))
fi

echo ""

# Validate domain repos from registry
echo "[2/3] Validating domain repos from registry..."

DOMAINS=$(python3 -c "
import json
with open('$ROOT_DIR/registry/domains.json') as f:
    data = json.load(f)
for d in data:
    print(d['repo'])
" 2>/dev/null)

mkdir -p "$TMP_DIR"

for repo_url in $DOMAINS; do
  repo_name=$(basename "$repo_url" .git)
  echo "  $repo_name..."

  # Check repo exists on GitHub
  if curl -sI "https://github.com/aikdna/$repo_name" | grep -q "200 OK"; then
    pass "Repo exists: $repo_name"
  else
    fail "Repo not accessible: $repo_name"
    FAILURES=$((FAILURES + 1))
    continue
  fi

  # Clone and validate
  clone_dir="$TMP_DIR/$repo_name"
  if git clone --depth 1 "git@github.com-aikdna:aikdna/$repo_name.git" "$clone_dir" 2>/dev/null; then
    # Check required files
    has_core=false
    has_patterns=false
    for file in "$clone_dir"/*.json; do
      case "$(basename "$file")" in
        KDNA_Core.json) has_core=true ;;
        KDNA_Patterns.json) has_patterns=true ;;
      esac
    done

    if $has_core; then pass "KDNA_Core.json present"; else fail "Missing KDNA_Core.json"; FAILURES=$((FAILURES + 1)); fi
    if $has_patterns; then pass "KDNA_Patterns.json present"; else fail "Missing KDNA_Patterns.json"; FAILURES=$((FAILURES + 1)); fi

    # Validate JSON structure
    if [ -f "$clone_dir/KDNA_Core.json" ]; then
      if python3 -c "
import json
with open('$clone_dir/KDNA_Core.json') as f:
    data = json.load(f)
assert 'meta' in data, 'missing meta'
assert 'axioms' in data, 'missing axioms'
assert 'ontology' in data, 'missing ontology'
" 2>/dev/null; then
        pass "KDNA_Core.json structure valid"
      else
        fail "KDNA_Core.json structure invalid"
        FAILURES=$((FAILURES + 1))
      fi
    fi

    if [ -f "$clone_dir/KDNA_Patterns.json" ]; then
      if python3 -c "
import json
with open('$clone_dir/KDNA_Patterns.json') as f:
    data = json.load(f)
assert 'meta' in data, 'missing meta'
assert 'terminology' in data, 'missing terminology'
assert 'misunderstandings' in data, 'missing misunderstandings'
assert 'self_check' in data, 'missing self_check'
" 2>/dev/null; then
        pass "KDNA_Patterns.json structure valid"
      else
        fail "KDNA_Patterns.json structure invalid"
        FAILURES=$((FAILURES + 1))
      fi
    fi

    # Check README
    if [ -f "$clone_dir/README.md" ]; then pass "README.md present"; else fail "Missing README.md"; FAILURES=$((FAILURES + 1)); fi
    if [ -f "$clone_dir/README.zh.md" ]; then pass "README.zh.md present"; else warn "Missing README.zh.md"; fi
  else
    fail "Clone failed: $repo_name"
    FAILURES=$((FAILURES + 1))
  fi

  echo ""
done

# Validate tool repos
echo "[3/3] Validating tool repos..."

if curl -sI "https://github.com/aikdna/kdna-skills" | grep -q "200 OK"; then
  pass "kdna-skills repo exists"

  clone_dir="$TMP_DIR/kdna-skills"
  if git clone --depth 1 "git@github.com-aikdna:aikdna/kdna-skills.git" "$clone_dir" 2>/dev/null; then
    if [ -f "$clone_dir/kdna-loader/SKILL.md" ]; then pass "kdna-loader/SKILL.md present"; else fail "Missing kdna-loader/SKILL.md"; FAILURES=$((FAILURES + 1)); fi
    if [ -f "$clone_dir/kdna-create/SKILL.md" ]; then pass "kdna-create/SKILL.md present"; else fail "Missing kdna-create/SKILL.md"; FAILURES=$((FAILURES + 1)); fi
    if [ -f "$clone_dir/install.sh" ]; then pass "install.sh present"; else warn "Missing install.sh"; fi
    if [ -f "$clone_dir/README.zh.md" ]; then pass "README.zh.md present"; else warn "Missing README.zh.md"; fi
  fi
else
  fail "kdna-skills repo not accessible"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "========================================="
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
  exit 0
else
  echo -e "${RED}$FAILURES check(s) failed.${NC}"
  exit 1
fi
