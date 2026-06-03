#!/usr/bin/env bash
# Smoke check: installed KDNA domains via CLI
# Runs kdna available, kdna load, kdna verify for all official domains.
# Outputs a JSON report to stdout. Exit 0 = all pass, 1 = one or more fail.
#
# Usage: bash scripts/smoke-installed-domains.sh [--json] [--domain NAME]
#
# Prerequisites:
#   npm install -g @aikdna/kdna-cli
#   kdna setup
#   kdna install @aikdna/writing @aikdna/prompt_diagnosis @aikdna/agent_safety

set -euo pipefail
OUTPUT_JSON="${OUTPUT_JSON:-false}"
TARGET_DOMAIN="${TARGET_DOMAIN:-}"

DOMAINS=(
  "@aikdna/writing"
  "@aikdna/prompt_diagnosis"
  "@aikdna/agent_safety"
  "@aikdna/code_review"
  "@aikdna/kdna_authoring"
)

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

results_json() {
  local domain="$1" check="$2" status="$3" detail="$4" check_idx="$5" total="$6"
  local pass_bool="false"
  [[ "$status" == "pass" ]] && pass_bool="true"
  printf '    {"domain":"%s","check":"%s","status":"%s","detail":%s,"passed":%s}' \
    "$domain" "$check" "$status" "$detail" "$pass_bool"
  if [[ "$check_idx" -lt "$total" ]]; then
    printf ',\n'
  else
    printf '\n'
  fi
}

available_check() {
  local domain="$1"
  local result
  result=$(kdna available --json 2>/dev/null || echo '{"error":"kdna available failed"}')
  local found
  found=$(echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
domains=d.get('domains',d)
if isinstance(domains,list):
  for entry in domains:
    if entry.get('name','')=='$domain':
      print('found')
      break
  else:
    print('not-found')
else:
  print('error')
" 2>/dev/null || echo "error")
  if [[ "$found" == "found" ]]; then
    echo "pass" "$(echo "$result" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()[:200]))' 2>/dev/null || echo '"kdna available returned data"')"
  else
    echo "fail" "\"domain $domain not in kdna available output\""
  fi
}

load_check() {
  local domain="$1"
  local result exit_code
  result=$(kdna load "$domain" --as=json 2>/dev/null) || true
  exit_code=$?
  if [[ $exit_code -eq 0 ]] && echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); d.get('domain') or d.get('name')" >/dev/null 2>&1; then
    echo "pass" "\"kdna load $domain returned valid JSON\""
  else
    echo "fail" "\"kdna load $domain failed (exit $exit_code)\""
  fi
}

verify_check() {
  local domain="$1"
  local result exit_code
  result=$(kdna verify "$domain" --json 2>/dev/null) || true
  exit_code=$?
  local verify_status="pass"
  if [[ $exit_code -ne 0 ]]; then
    verify_status="fail"
  fi
  local detail
  detail=$(echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
out={'exit_code':$exit_code}
if isinstance(d,dict):
  for k in ('status','trust_ok','structure_ok','judgment_ok'):
    if k in d: out[k]=d[k]
print(json.dumps(out))
" 2>/dev/null || echo "\"kdna verify returned non-JSON (exit $exit_code)\"")
  echo "$verify_status" "$detail"
}

echo "{"
echo "  \"smoke_check\": \"kdna-installed-domains\","
echo "  \"timestamp\": \"$NOW\","
echo "  \"kdna_cli_version\": \"$(kdna --version 2>/dev/null || echo 'unknown')\","
echo "  \"kdna_home\": \"${KDNA_HOME:-$HOME/.kdna}\","
echo "  \"hostname\": \"$(hostname 2>/dev/null || echo 'unknown')\","
echo "  \"results\": ["

total_checks=$((${#DOMAINS[@]} * 3))
check_idx=0
failures=0

for domain in "${DOMAINS[@]}"; do
  if [[ -n "$TARGET_DOMAIN" && "$domain" != "$TARGET_DOMAIN" ]]; then
    continue
  fi

  ((check_idx++)) || true
  read -r status detail <<< "$(available_check "$domain")"
  [[ "$status" == "fail" ]] && ((failures++)) || true
  results_json "$domain" "available" "$status" "$detail" "$check_idx" "$total_checks"

  ((check_idx++)) || true
  read -r status detail <<< "$(load_check "$domain")"
  [[ "$status" == "fail" ]] && ((failures++)) || true
  results_json "$domain" "load" "$status" "$detail" "$check_idx" "$total_checks"

  ((check_idx++)) || true
  read -r status detail <<< "$(verify_check "$domain")"
  [[ "$status" == "fail" ]] && ((failures++)) || true
  results_json "$domain" "verify" "$status" "$detail" "$check_idx" "$total_checks"
done

echo "  ],"
echo "  \"summary\": {"
echo "    \"total_checks\": $total_checks,"
echo "    \"failures\": $failures,"
echo "    \"overall\": \"$([[ $failures -eq 0 ]] && echo 'pass' || echo 'fail')\""
echo "  }"
echo "}"

[[ $failures -eq 0 ]] && exit 0 || exit 1
