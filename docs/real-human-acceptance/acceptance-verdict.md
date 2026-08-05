# Real-Human Acceptance — Verdict Table (Item 1)

Purpose: the verdict table for the first real-human acceptance item. The Owner
walks each row and marks `expected vs actual` in under 30 minutes. A row passes
only when the observed behavior matches the expected screen.

This table is a **template**; acceptance is not executed from this file. Real
acceptance runs record their own dated copy.

## How to fill

- **Step**: the step id from the create/consume scripts.
- **Expected**: the exact screen/behavior the step must show.
- **Actual**: what the Owner actually observed.
- **Pass?**: `Y` only if they match. Any mismatch is a fail for that row.

## Item 1 — create a real asset and see the judgment in a real task

| # | Step | Expected | Actual | Pass? |
|---|------|----------|--------|-------|
| 1 | Create: answer the 6 questions | Each answer is your real judgment, not a generic assistant answer | | |
| 2 | Create: fill the draft template | Template contains your highest question, a rule, boundaries, a failure risk | | |
| 3 | Create: build the source dir | Manifest + payload produced in the source directory, no schema errors | | |
| 4 | Create: `kdna validate` | Gate 1–4 pass, `overall_valid: true` | | |
| 5 | Create: `kdna pack` | A `.kdna` container is produced | | |
| 6 | Consume: `kdna inspect` | Domain/title/version/profiles listed | | |
| 7 | Consume: `kdna load` | A load plan is shown and approved before load | | |
| 8 | Consume: judgment in the real task | Output reflects your rule, boundaries, and failure risk | | |
| 9 | Consume: fail-closed (corrupted copy) | Load rejected with a stable error code | | |
| 10 | Boundary: material is real-human | The asset is marked real-human, not SIMULATION | | |

## Verdict

- All rows `Y`: **item 1 PASS** — the real-human path works end to end.
- Any row `N`: **item 1 FAIL** — record which row and the actual behavior;
  the acceptance is not advanced until the mismatch is resolved.
- Any row left blank: **item 1 NOT_RUN** — do not count it as pass or fail.

## Timing

Each row is designed to be checked in under 3 minutes; the whole table in under
30 minutes including the real-task step.
