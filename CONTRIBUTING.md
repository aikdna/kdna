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

If a pull request is squash-merged, the final squash commit must also carry a
`Signed-off-by:` trailer that exactly matches the author name and email GitHub
assigns to that commit. The trailers on the pull request's source commits do
not replace this final-commit requirement.

This certifies that you wrote the code or have the right to submit it under the project's license (Apache-2.0). No CLA is required.

## Contract and scope discipline

- Treat `.kdna` as the portable object. Do not introduce a required global
  library, automatic machine-wide discovery, or silent asset selection.
- Keep possession, attachment, authorization, applicability, projection, and
  Host delivery as separate facts.
- Do not infer current commands from retired baselines or old decision notes.
  Check the exact candidate or published coordinate you are changing, its
  `--help`, tests, and current status documentation.
- Do not make KDNA validity depend on output improvement, Prompt/Skill
  superiority, universal correctness, or a quality badge.
- New public responsibilities, repositories, compatibility promises, or
  destructive removals require an approved proposal and an identified real
  consumer or failure.

Historical command and architecture decisions remain useful provenance, but
they do not override the current file-first product contract or the exact
released contract of an older coordinate.
