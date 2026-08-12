#!/usr/bin/env bash
set -euo pipefail

root="${1:-.}"

echo "== Git remotes =="
find "$root" -name .git -type d -prune -print0 | sort -z |
  while IFS= read -r -d '' gitdir; do
    repo="${gitdir%/.git}"
    echo "## ${repo}"
    git -C "$repo" remote -v |
      sed -E 's#(https://)[^/@]+@#\1***@#g; s#(gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)#***TOKEN***#g'
  done

echo

echo "== .env files at repo roots =="
find "$root" -maxdepth 2 -name '.env*' -type f -prune |
  while IFS= read -r envfile; do
    echo "WARNING: $envfile should not be committed"
    exit 1
  done
echo "No .env files found in repo roots."

echo

echo "== Token-like strings =="
scan_cmd="rg"
if ! command -v rg &>/dev/null; then
  scan_cmd="grep -r"
fi

if [ "$scan_cmd" = "rg" ]; then
  if rg -n \
    'gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|x-access-token|Authorization: token|Authorization: Bearer' \
    "$root" \
    -g '!node_modules' \
    -g '!dist' \
    -g '!build' \
    -g '!coverage' \
    -g '!*.lock' \
    -g '!.git' \
    -g '!scripts/audit-security.sh' \
    -S; then
    echo
    echo "Potential secrets found. Rotate any real credentials before publishing."
    exit 1
  fi
else
  if grep -rIn \
    --exclude-dir='node_modules' \
    --exclude-dir='dist' \
    --exclude-dir='build' \
    --exclude-dir='coverage' \
    --exclude-dir='.git' \
    --exclude='*.lock' \
    --exclude='scripts/audit-security.sh' \
    -E 'gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|x-access-token|Authorization: token|Authorization: Bearer' \
    "$root" 2>/dev/null; then
    echo
    echo "Potential secrets found. Rotate any real credentials before publishing."
    exit 1
  fi
fi

echo "No token-like strings found."

echo

echo "== PyPI kdna name-squat release monitor =="
# The PyPI `kdna` project name is an unrelated third-party placeholder, not
# ours. Our official Python distribution on PyPI is `aikdna` (import package
# `kdna`). If anyone uploads a release file to the `kdna` project, alert so a
# reader cannot mistake it for our package.
if ! command -v curl >/dev/null 2>&1; then
  echo "SKIP: curl not available; PyPI kdna squat monitor not run."
else
  body="$(curl -fsS -A 'Mozilla/5.0 (AIKDNA typosquat watch)' --max-time 30 https://pypi.org/simple/kdna/ 2>/dev/null || true)"
  count="$(printf '%s' "$body" | grep -cE 'href="[^"]*\.(whl|tar\.gz)#sha256=' || true)"
  if (( count > 0 )); then
    echo "ALERT: PyPI project \"kdna\" now hosts $count release file(s) (name squat)."
    printf '%s\n' "$body" | grep -oE 'href="[^"]*"' || true
    exit 1
  fi
  echo "OK: PyPI \"kdna\" has no release files (name-squat monitor clear)."
fi
