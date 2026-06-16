#!/bin/bash
# scripts/scan-repo-compliance.sh
# 28 KDNA 仓库合规扫描 — 可复现审计证据
# 用法: bash scripts/scan-repo-compliance.sh /Users/AI/K/OPEN
# 输出: stdout + 写到 .compliance-scan-YYYYMMDD.log

set -u
ROOT="${1:-/Users/AI/K/OPEN}"
LOG=".compliance-scan-$(date -u +%Y%m%d).log"
cd "$ROOT" || { echo "ERROR: $ROOT not found"; exit 2; }

REPOS=$(ls -d kdna* sketchnote-style test_domain 2>/dev/null | sort)

{
  echo "=== KDNA 仓库合规扫描 ==="
  echo "Root: $ROOT"
  echo "Date (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Repos: $(echo "$REPOS" | wc -l | tr -d ' ')"
  echo ""
  printf "%-32s | %-7s %-7s %-4s %-4s %-6s %-4s %-5s %-3s | %-12s\n" \
    "REPO" "LICENSE" "README" "CONT" "SEC" "CHLOG" "CI" "CODE" "GIT" "HEAD-SHA"
  printf "%-32s-+-%-7s-%-7s-%-4s-%-4s-%-6s-%-4s-%-5s-%-3s-+-%-12s\n" \
    "--------------------------------" "-------" "-------" "----" "----" "------" "----" "-----" "---" "------------"

  for d in $REPOS; do
    [ -d "$d" ] || continue
    [ -d "$d/.git" ] || { echo "SKIP: $d (not a git repo)"; continue; }

    lic="NO"; rm="NO"; ct="NO"; sc="NO"; ch="NO"; ci="NO"; co="NO"; gi="NO"
    [ -f "$d/LICENSE" ] || [ -f "$d/LICENSE.md" ] && lic="yes"
    [ -f "$d/README.md" ] && rm="yes"
    [ -f "$d/CONTRIBUTING.md" ] && ct="yes"
    [ -f "$d/SECURITY.md" ] && sc="yes"
    [ -f "$d/CHANGELOG.md" ] && ch="yes"
    [ -d "$d/.github/workflows" ] && ci="yes"
    [ -f "$d/CODE_OF_CONDUCT.md" ] && co="yes"
    [ -f "$d/.gitignore" ] && gi="yes"
    head_sha=$(git -C "$d" rev-parse --short HEAD 2>/dev/null || echo "n/a")
    printf "%-32s | %-7s %-7s %-4s %-4s %-6s %-4s %-5s %-3s | %-12s\n" \
      "$d" "$lic" "$rm" "$ct" "$sc" "$ch" "$ci" "$co" "$gi" "$head_sha"
  done

  echo ""
  echo "=== Notes ==="
  echo "- LICENSE: LICENSE or LICENSE.md present"
  echo "- README: README.md present (bilingual .zh.md optional)"
  echo "- CONT: CONTRIBUTING.md present"
  echo "- SEC: SECURITY.md present"
  echo "- CHLOG: CHANGELOG.md present"
  echo "- CI: .github/workflows/ directory present"
  echo "- CODE: CODE_OF_CONDUCT.md present"
  echo "- GIT: .gitignore present"
  echo "- HEAD-SHA: git rev-parse --short HEAD (last commit on current branch)"
} | tee "$LOG"

echo ""
echo "Log written to: $ROOT/$LOG"
