# 0006 — Branch and tag protection rules

## Status
Accepted. Manual enforcement required until CI pipeline is built.

## Branch protection (main)

For all 6 core repos, the `main` branch must have:
- Force pushes: **disabled**
- Deletion: **disabled**
- Linear history: **preferred** (squash or rebase merge)

Set in GitHub UI for each repo:
```
Settings → Branches → Add branch protection rule
  Branch name pattern: main
  ☐ Allow force pushes
  ☐ Allow deletions
```

## Tag immutability

Release tags (`v*`) must not be moved or deleted after creation.
- If a release is broken: publish a new patch version with a new tag.
- Old releases: mark as superseded in the release body. Do not delete.
- This prevents silent npm patches that leave no GitHub trace.

## Commit policy
- `main` commits should come via PR merge, not direct push.
- Emergency direct pushes must be documented in the commit message with `[emergency]` prefix and an issue reference.
