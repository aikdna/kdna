# RFC-0010: Fidelity Protocol — Withdrawn Draft

Status: **Withdrawn; historical external-evaluation design**

This RFC previously proposed a standardized, multi-arm behavioral evaluation
system with blind comparisons, scores, promotion thresholds, badges, registry
integration, and continuous benchmark infrastructure. It is not a current KDNA
Core, CLI, release, or product contract.

## Why it was withdrawn

KDNA is a judgment-asset container and Runtime contract. Core can prove which
asset bytes were identified, whether the container and integrity records are
valid, whether authorization and compatibility requirements are satisfied, and
which Runtime Capsule was produced. It cannot infer from those facts that an
asset is correct, better, expert, trustworthy, or useful.

Behavioral adoption and external utility remain legitimate asset-level research
questions, but their answers belong to the named evaluator, task set, model,
Host, Runtime, method, and date. They do not determine whether KDNA exists or
whether the base format is valid.

## Current boundary

- There is no required project-level A/B, Prompt, Skill, five-arm, blind-score,
  leaderboard, or improvement gate.
- There is no current CLI comparison command promised by this RFC.
- The historical `fidelity-result.schema.json` may describe old research
  artifacts; it is not a conformance schema or a promotion authority.
- A product may perform a small owner-approved acceptance exercise to check
  in-scope judgment direction, out-of-scope restraint, conflict deference,
  authorization, and rollback. That exercise is not a universal evaluation
  protocol.
- Any future public evaluation capability must pass product admission as a
  separate, issuer-scoped surface and cannot redefine Core validity.

Git history preserves the original draft and its detailed methodology. No
command, score threshold, public badge, registry duty, or compatibility promise
may be inferred from this withdrawn file.
