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

## P3 status: PASS

All active public surfaces are free of internal language, private
paths, emotional expression, and AI-assistant traces. The few
hits are all in files that already carry historical snapshot
banners (docs/GOVERNANCE.md) or are false-positives (product
feature descriptions, sensor scenario descriptions, technical
terms).
