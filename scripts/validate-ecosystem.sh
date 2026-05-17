#!/usr/bin/env bash
set -euo pipefail
# KDNA Cross-Repo Validator v0.2
# Validates all domain repos listed in the registry and tools repos.
# Usage: ./scripts/validate-ecosystem.sh [--no-clone] [--local-only]

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

NO_CLONE=false
LOCAL_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --no-clone) NO_CLONE=true ;;
    --local-only) LOCAL_ONLY=true ;;
  esac
done

echo "=== KDNA Ecosystem Validator v0.2 ==="
echo ""

FAILURES=0

parse_domains() {
  python3 -c "
import json, sys
with open('$ROOT_DIR/registry/domains.json') as f:
    data = json.load(f)
domains = data.get('domains', data) if isinstance(data, dict) else data
for d in domains:
    print(d.get('repo', ''))
" 2>/dev/null
}

# ─── [1/3] Validate main repo ───

echo "[1/4] Validating main repo..."
cd "$ROOT_DIR"

for domain_dir in examples/communication examples/from-wiki-to-kdna/kdna examples/product_decision examples/management examples/sales; do
  domain_name=$(basename "$domain_dir")
  if [ -d "$domain_dir" ]; then
    if npx kdna-lint "$domain_dir" > /dev/null 2>&1; then
      pass "examples/$domain_name passes kdna-lint"
    else
      fail "examples/$domain_name fails kdna-lint"
      FAILURES=$((FAILURES + 1))
    fi
  fi
done

if [ -f "registry/domains.json" ]; then
  if python3 -c "import json; json.load(open('registry/domains.json'))" 2>/dev/null; then
    pass "registry/domains.json is valid JSON"

    DOMAIN_COUNT=$(parse_domains | wc -l | tr -d ' ')
    pass "registry/domains.json has $DOMAIN_COUNT domain entries"
  else
    fail "registry/domains.json is invalid JSON"
    FAILURES=$((FAILURES + 1))
  fi
else
  fail "registry/domains.json not found"
  FAILURES=$((FAILURES + 1))
fi

if [ -f "SPEC.md" ] && [ -f "README.md" ] && [ -f "README.zh.md" ]; then
  pass "core docs present (SPEC.md, README.md, README.zh.md)"
else
  fail "missing core docs"
  FAILURES=$((FAILURES + 1))
fi

if [ -d "specs" ]; then
  spec_count=$(ls specs/*.md 2>/dev/null | wc -l | tr -d ' ')
  pass "specs/ directory present ($spec_count specification files)"
else
  warn "specs/ directory not found"
fi

if [ -f "src/cli.js" ]; then
  pass "CLI entry point (src/cli.js) present"
else
  fail "CLI entry point (src/cli.js) missing"
  FAILURES=$((FAILURES + 1))
fi

echo ""

# ─── [2/4] Validate local example domains ───

echo "[2/4] Validating local example domains..."

EXAMPLE_DIRS=$(find "$ROOT_DIR/examples" -maxdepth 2 -name "KDNA_Core.json" -exec dirname {} \; 2>/dev/null | sort -u)

for dir in $EXAMPLE_DIRS; do
  name=$(basename "$dir")
  echo "  $name..."

  if [ -f "$dir/KDNA_Core.json" ]; then pass "KDNA_Core.json present"
  else fail "Missing KDNA_Core.json"; FAILURES=$((FAILURES + 1)); fi

  if [ -f "$dir/KDNA_Patterns.json" ]; then pass "KDNA_Patterns.json present"
  else fail "Missing KDNA_Patterns.json"; FAILURES=$((FAILURES + 1)); fi

  if [ -f "$dir/kdna.json" ]; then pass "kdna.json manifest present"
  else warn "Missing kdna.json manifest (run: kdna pack $dir)"; fi

  if [ -f "$dir/README.md" ]; then pass "README.md present"
  else warn "Missing README.md"; fi

  if [ -f "$dir/KDNA_Core.json" ]; then
    if python3 -c "
import json
with open('$dir/KDNA_Core.json') as f:
    data = json.load(f)
assert 'meta' in data, 'missing meta'
assert 'axioms' in data, 'missing axioms'
assert data.get('axioms'), 'axioms is empty'
assert 'ontology' in data, 'missing ontology'
" 2>/dev/null; then
      axiom_count=$(python3 -c "import json; d=json.load(open('$dir/KDNA_Core.json')); print(len(d.get('axioms',[])))")
      pass "KDNA_Core.json valid ($axiom_count axioms)"
    else
      fail "KDNA_Core.json structure invalid"
      FAILURES=$((FAILURES + 1))
    fi
  fi

  echo ""
done

# ─── [3/4] Validate domain repos from registry ───

echo "[3/4] Validating remote domain repos..."

DOMAINS=$(parse_domains)
mkdir -p "$TMP_DIR"

for repo_url in $DOMAINS; do
  [ -z "$repo_url" ] && continue
  repo_name=$(basename "$repo_url" .git)
  echo "  $repo_name..."

  if $LOCAL_ONLY; then
    warn "Skipping remote check (--local-only)"
    continue
  fi

  # Check repo exists on GitHub
  if curl -sI --connect-timeout 5 "https://github.com/aikdna/$repo_name" 2>/dev/null | grep -q "200 OK"; then
    pass "Repo exists: $repo_name"
  else
    # Try as a standalone repo name (not under aikdna org)
    if curl -sI --connect-timeout 5 "$repo_url" 2>/dev/null | grep -q "200 OK"; then
      pass "Repo exists: $repo_name"
    else
      warn "Repo not accessible (may be private or renamed): $repo_name"
      echo ""
      continue
    fi
  fi

  if $NO_CLONE; then
    warn "Skipping clone (--no-clone)"
    echo ""
    continue
  fi

  clone_dir="$TMP_DIR/$repo_name"
  cloned=false

  # Try HTTPS clone first (CI-friendly)
  if git clone --depth 1 "https://github.com/aikdna/${repo_name}.git" "$clone_dir" 2>/dev/null; then
    cloned=true
  # Fallback: SSH
  elif git clone --depth 1 "git@github.com:aikdna/${repo_name}.git" "$clone_dir" 2>/dev/null; then
    cloned=true
  fi

  if $cloned; then
    [ -f "$clone_dir/KDNA_Core.json" ] && pass "KDNA_Core.json present" || { fail "Missing KDNA_Core.json"; FAILURES=$((FAILURES + 1)); }
    [ -f "$clone_dir/KDNA_Patterns.json" ] && pass "KDNA_Patterns.json present" || { fail "Missing KDNA_Patterns.json"; FAILURES=$((FAILURES + 1)); }
    [ -f "$clone_dir/README.md" ] && pass "README.md present" || warn "Missing README.md"
    [ -f "$clone_dir/kdna.json" ] && pass "kdna.json manifest present" || warn "Missing kdna.json manifest"
  else
    warn "Clone failed (no git credentials available): $repo_name"
  fi

  echo ""
done

# ─── [4/4] Validate tool repos ───

echo "[4/4] Validating tool repos..."

if $LOCAL_ONLY; then
  warn "Skipping remote tool repo checks (--local-only)"
else
  for tool_repo in kdna-skills; do
    echo "  $tool_repo..."
    if curl -sI --connect-timeout 5 "https://github.com/aikdna/$tool_repo" 2>/dev/null | grep -q "200 OK"; then
      pass "Repo exists: $tool_repo"

      if ! $NO_CLONE; then
        clone_dir="$TMP_DIR/$tool_repo"
        cloned=false
        if git clone --depth 1 "https://github.com/aikdna/${tool_repo}.git" "$clone_dir" 2>/dev/null; then
          cloned=true
        elif git clone --depth 1 "git@github.com:aikdna/${tool_repo}.git" "$clone_dir" 2>/dev/null; then
          cloned=true
        fi

        if $cloned; then
          [ -f "$clone_dir/kdna-loader/SKILL.md" ] && pass "kdna-loader/SKILL.md present" || warn "Missing kdna-loader/SKILL.md"
          [ -f "$clone_dir/kdna-create/SKILL.md" ] && pass "kdna-create/SKILL.md present" || warn "Missing kdna-create/SKILL.md"
          [ -f "$clone_dir/install.sh" ] && pass "install.sh present" || warn "Missing install.sh"
          [ -f "$clone_dir/README.md" ] && pass "README.md present" || warn "Missing README.md"
        fi
      fi
    else
      warn "Repo not accessible: $tool_repo"
    fi
    echo ""
  done
fi

echo "========================================="
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
  exit 0
else
  echo -e "${RED}$FAILURES check(s) failed.${NC}"
  exit 1
fi
