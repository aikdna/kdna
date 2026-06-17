# P3 Internal Language & Private Path Scan — June 2026

## Scope

Scan all public surfaces (READMEs, docs/, specs/) in kdna main repo
for internal language, private paths, emotional/self-justifying
expression, and AI-assistant traces.

## Methodology

Search terms: see below. Excluded: node_modules/, .git/, audits/,
archive/ (these are historical by definition). Hits are classified:
allowed, fixed, pending, or false-positive.

## Results

### ZH internal traces

| Term | Hits | Classification |
|---|---|---|
| 内部思考 | 1 (in docs/GOVERNANCE.md) | allowed — this doc has a historical banner; the hit is in the example audit paths section |
| 工作计划 | 1 (in docs/GOVERNANCE.md) | allowed — same historical context |
| 用户要求 | 1 (in docs/authoring-pipeline-principles.zh.md) | false-positive — describes a product feature: "not passive, actively generates counterexamples instead of waiting for user to ask" |
| 用户说 | 1 (in docs/loader-behavior.zh.md) | false-positive — describes a sensor scenario: "If the user says X, the agent reframes..." |
| /Users/AI/ | 2 (in docs/GOVERNANCE.md) | allowed — in the historical governance doc's audit-paths example section. The file already has a historical banner |

### EN internal traces

| Term | Hits | Classification |
|---|---|---|
| private notes | 1 (in docs/GOVERNANCE.md) | allowed — historical doc with banner |
| wrong direction | 1 (in docs/judgment-contamination.md) | false-positive — this is a technical term describing judgment contamination: "an external judgment framework steered it in the wrong direction" |
| we misunderstood | 0 | — |
| internal work plan | 0 | — |
| per user request | 0 | — |
| scratchpad | 0 | — |
| cleanup because we were wrong | 0 | — |
| self-justification | 0 | — |
| maintainer bypass / admin bypass | 0 | — |

### Active docs (non-archive, non-banner)

No hits of:
- internal language in active README / start-here / docs/core/
- private paths (/Users/, /mnt/, etc.) in active docs
- emotional / self-justifying language in active docs
- AI-assistant traces in active user-facing text

## P3 status: CONDITIONAL PASS after syntheticization

The v4 cleanup (2026-06-17) replaced all real internal terms in active
public docs (docs/GOVERNANCE.md §9.3-9.4) with synthetic placeholders.
Previously, the section exposed 8 real internal terms (maintainer names,
private file paths, project codenames, upgrade-plan file names) in
"Bad examples" and grep checklists. These are now synthetic.

Remaining: historical files (RFC-0013, audit notes, implementation
evidence pack) still contain neutralized-but-real references to
internal processes like "direct push", "local backup tag", and
"maintainer review notes". These are preserved in historical
snapshots with banners.

Scanner pattern examples use synthetic placeholders only:
`private-planning-folder`, `private-upgrade-plan.md`,
`/Users/example/private-workspace`, `private-maintainer`,
`private-team`, `local-backup-tag-not-pushed`,
`private-review-doc`, `private-domain-version-string`.
