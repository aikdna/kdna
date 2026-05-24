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
