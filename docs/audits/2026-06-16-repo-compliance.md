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
kdna                             | yes     yes     yes  yes  yes    yes  yes   yes | c97d***     
kdna-agent_safety                | yes     yes     yes  yes  yes    yes  yes   yes | see repo compliance     
kdna-animation                   | yes     yes     yes  yes  yes    yes  yes   yes | e7dd***     
kdna-app-shared                  | yes     yes     yes  yes  yes    yes  yes   yes | 67d8***     
kdna-authoring                   | yes     yes     yes  yes  yes    yes  yes   yes | fbcb***     
kdna-cli                         | yes     yes     yes  yes  yes    yes  yes   yes | c8fd***     
kdna-code_review                 | yes     yes     yes  yes  yes    yes  yes   yes | f68c***     
kdna-content_strategy            | yes     yes     yes  yes  NO     yes  yes   yes | f431***     
kdna-core-swift                  | yes     yes     yes  yes  yes    yes  yes   yes | 27a1***     
kdna-decision_state              | yes     yes     yes  yes  NO     yes  yes   yes | 5ae7***     
kdna-for-agent-skills            | yes     yes     yes  yes  NO     yes  yes   yes | 9fe0***     
kdna-knowledge_management        | yes     yes     yes  yes  NO     yes  yes   yes | f83a***     
lab (private)                         | yes     yes     yes  NO   yes    yes  yes   yes | see repo compliance     
kdna-open_source_project         | yes     yes     yes  yes  NO     yes  yes   yes | c511***     
kdna-prompt_diagnosis            | yes     yes     yes  yes  yes    yes  yes   yes | see repo compliance     
kdna-registry                    | yes     yes     yes  yes  yes    yes  yes   yes | see repo compliance     
kdna-requirement_alignment       | yes     yes     yes  yes  yes    yes  yes   NO  | a54d***     
kdna-skills                      | yes     yes     yes  yes  yes    yes  yes   yes | a94f***     
kdna-studio-cli                  | yes     yes     yes  yes  yes    yes  yes   yes | 6299***     
kdna-studio-core                 | yes     yes     yes  yes  yes    yes  yes   yes | 599f***     
kdna-studio-swift                | yes     yes     yes  yes  yes    yes  yes   yes | 80bc***     
kdna-vscode                      | yes     yes     yes  yes  yes    yes  yes   yes | ef63***     
kdna-workpack                    | yes     yes     yes  yes  yes    yes  yes   yes | 1d23***     
kdna-writing                     | yes     yes     yes  yes  yes    yes  yes   yes | see repo compliance     
sketchnote-style                 | yes     yes     yes  yes  yes    yes  yes   yes | aaad***     
test_domain                      | yes     yes     yes  yes  yes    yes  yes   yes | ba51***     

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
