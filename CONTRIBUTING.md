# Contributing to KDNA

## Issues

Open an issue at the repository. Include:
- `kdna version` output
- OS and shell
- Minimal reproduction steps
- Expected vs actual behavior

If proposing a feature, tag with `[RFC]` and describe the problem before the solution.

## Pull Requests

1. Fork and branch from `main`.
2. Keep PRs focused — one logical change per PR.
3. All commits must be signed off: `git commit -s`
4. Use the PR template. Title format: `area: what changed`.
5. Verify before opening:
   - `npm test` passes
   - `npm run lint` passes (if available)
   - `kdna validate` works against a test .kdna file
   - For CLI changes: verify `kdna --help` output is correct
   - For asset changes: include SHA256 and validation output

PRs that fail any verification command will be reviewed with requested changes.

## Developer Certificate of Origin (DCO)

All commits must include a `Signed-off-by:` line. Use `git commit -s` to add it automatically.

This certifies that you wrote the code or have the right to submit it under the project's license (Apache-2.0). No CLA is required.

## ANTI-PATTERNS

Do **not** attempt to restore, shim, or reference any of these removed surfaces:
- `legacy` — deleted in 0.27.0 hard cutover
- `v2` — never existed; do not create
- `registry` — deferred to future RFC (see decisions/0003)
- `install` — no distribution in v0.7 baseline (the v0.7 line is the public stable line as of 2026-05-22; pre-v0.7 "v1 Core GA" terminology is superseded)
- `help-legacy` — deleted alongside legacy surface
- `setup` / `verify` — removed commands; use `kdna create` and `kdna validate`

If your PR touches any of the above, it will be rejected. Read `decisions/` for rationale.
