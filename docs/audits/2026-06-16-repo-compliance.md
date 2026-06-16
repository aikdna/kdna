# Repo Compliance Scan — 2026-06-16

Audit evidence captured at 2026-06-16T02:07:53Z.

Re-run:

```bash
bash scripts/scan-repo-compliance.sh /path/to/local-workspace
```

## Matrix

```
=== KDNA 仓库合规扫描 ===
Root: /path/to/local-workspace
Date (UTC): 2026-06-16T02:07:53Z
Repos: 26

REPO                             | LICENSE README  CONT SEC  CHLOG  CI   CODE  GIT | HEAD-SHA    
---------------------------------+-------------------------------------------------+-------------
kdna                             | yes     yes     yes  yes  yes    yes  yes   yes | c97dc73     
kdna-agent_safety                | yes     yes     yes  yes  yes    yes  yes   yes | 5c0a7f8     
kdna-animation                   | yes     yes     yes  yes  yes    yes  yes   yes | e7ddc06     
kdna-app-shared                  | yes     yes     yes  yes  yes    yes  yes   yes | 67d806d     
kdna-authoring                   | yes     yes     yes  yes  yes    yes  yes   yes | fbcbdce     
kdna-cli                         | yes     yes     yes  yes  yes    yes  yes   yes | c8fd958     
kdna-code_review                 | yes     yes     yes  yes  yes    yes  yes   yes | f68ccd0     
kdna-content_strategy            | yes     yes     yes  yes  NO     yes  yes   yes | f4312e1     
kdna-core-swift                  | yes     yes     yes  yes  yes    yes  yes   yes | 27a18d5     
kdna-decision_state              | yes     yes     yes  yes  NO     yes  yes   yes | 5ae7210     
kdna-for-agent-skills            | yes     yes     yes  yes  NO     yes  yes   yes | 9fe05c3     
kdna-knowledge_management        | yes     yes     yes  yes  NO     yes  yes   yes | f83a79a     
kdna-lab                         | yes     yes     yes  NO   yes    yes  yes   yes | 040ffc6     
kdna-open_source_project         | yes     yes     yes  yes  NO     yes  yes   yes | c51120c     
kdna-prompt_diagnosis            | yes     yes     yes  yes  yes    yes  yes   yes | f0e7cfe     
kdna-registry                    | yes     yes     yes  yes  yes    yes  yes   yes | fd606cb     
kdna-requirement_alignment       | yes     yes     yes  yes  yes    yes  yes   NO  | a54d610     
kdna-skills                      | yes     yes     yes  yes  yes    yes  yes   yes | a94fe5d     
kdna-studio-cli                  | yes     yes     yes  yes  yes    yes  yes   yes | 6299f46     
kdna-studio-core                 | yes     yes     yes  yes  yes    yes  yes   yes | 599f1a8     
kdna-studio-swift                | yes     yes     yes  yes  yes    yes  yes   yes | 80bcbda     
kdna-vscode                      | yes     yes     yes  yes  yes    yes  yes   yes | ef6354b     
kdna-workpack                    | yes     yes     yes  yes  yes    yes  yes   yes | 1d238c5     
kdna-writing                     | yes     yes     yes  yes  yes    yes  yes   yes | b8a22d4     
sketchnote-style                 | yes     yes     yes  yes  yes    yes  yes   yes | aaada1e     
test_domain                      | yes     yes     yes  yes  yes    yes  yes   yes | ba5153a     

=== Notes ===
- LICENSE: LICENSE or LICENSE.md present
- README: README.md present (bilingual .zh.md optional)
- CONT: CONTRIBUTING.md present
- SEC: SECURITY.md present
- CHLOG: CHANGELOG.md present
- CI: .github/workflows/ directory present
- CODE: CODE_OF_CONDUCT.md present
- GIT: .gitignore present
- HEAD-SHA: git rev-parse --short HEAD (last commit on current branch)

Log written to: /path/to/local-workspace/.compliance-scan-20260616.log
```

## Summary

| Item | Coverage |
|------|----------|
| LICENSE | 26/26 |
| README | 26/26 |
| CONTRIBUTING | 26/26 |
| SECURITY | 26/26 |
| CI workflows (.github/workflows/) | 26/26 |
| CODE_OF_CONDUCT | 26/26 |
| CHANGELOG | 22/26 |
| .gitignore | 25/26 |

## Known Gaps

Repos missing CHANGELOG.md:

- kdna-content_strategy
- kdna-decision_state
- kdna-knowledge_management
- kdna-for-agent-skills
- kdna-open_source_project

These are documented-experimental repos (marked experimental
in batch commit 2026-06-09). CHANGELOG will be added if/when
they exit experimental status.

Repos missing .gitignore:

- kdna-requirement_alignment

Will be added in next batch (low priority, repo uses defaults).
