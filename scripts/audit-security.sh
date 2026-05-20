#!/usr/bin/env bash
set -euo pipefail

root="${1:-.}"

echo "== Git remotes =="
find "$root" -name .git -type d -prune -print0 |
  while IFS= read -r -d '' gitdir; do
    repo="${gitdir%/.git}"
    echo "## ${repo}"
    git -C "$repo" remote -v |
      sed -E 's#(https://)[^/@]+@#\1***@#g; s#(gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)#***TOKEN***#g'
  done

echo
echo "== Token-like strings =="
if command -v rg >/dev/null 2>&1; then
  if rg -n \
    'gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|x-access-token|Authorization: token|Authorization: Bearer' \
    "$root" \
    -g '!node_modules' \
    -g '!*.lock' \
    -g '!.git' \
    -g '!scripts/audit-security.sh' \
    -S; then
    echo
    echo "Potential secrets found. Rotate any real credentials before publishing."
    exit 1
  fi
else
  echo "ripgrep not found; skipping token string scan"
fi

echo "No token-like strings found."
