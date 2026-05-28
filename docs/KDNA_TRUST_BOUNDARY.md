# KDNA Trust Boundary

KDNA encodes judgment, not objective truth.

A valid `.kdna` asset proves structural conformance and loadability. It does not
prove that the encoded judgment is universally correct, safe for every context,
or professionally endorsed.

## Trust Layers

| Layer | Verifies | Does not verify |
| --- | --- | --- |
| Integrity | File bytes match the declared digest | Judgment quality |
| Provenance | Which scope or author signed the asset | Author expertise |
| Registry state | Yank, revocation, review, and risk metadata | Fitness for a user's situation |
| Quality badge | Evidence tier for evals/review/production use | Universal correctness |
| Runtime policy | Whether a loader may apply the asset now | Human authority |

## Required Runtime Posture

- `valid` does not mean `true`.
- `signed` does not mean `expert_reviewed`.
- `installed` does not mean `safe`.
- `quality_badge` does not mean correct in every scenario.
- `AI-loaded` does not transfer responsibility away from the human deployer.

## Fitness for Purpose

Loaders and users SHOULD evaluate:

- intended use
- out-of-scope situations
- known failure modes
- risk level
- required human review triggers
- local policy and legal constraints

KDNA helps AI systems apply explicit human judgment. It does not replace human
accountability.
