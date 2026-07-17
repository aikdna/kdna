# Evaluating a KDNA Asset

> [中文版](./evaluation.zh.md)

This document describes external evaluation. It is not KDNA Core format
validity, an official quality scale, or a promotion authority.

## Separate the claims

An evaluation should identify which claim it tests:

1. **Format claim** — the asset passes the current Schema, integrity, and load
   contract. Core and conformance tests own this claim.
2. **Delivery claim** — the intended asset version was authorized, projected,
   and delivered to the Host. LoadPlan, Capsule, and receipts support this.
3. **Adherence claim** — a model output is consistent with selected asset
   content under a named task and method.
4. **Causal claim** — loading this asset caused a measured behavioral change
   relative to a controlled alternative.
5. **Value claim** — an evaluator prefers that change under a named rubric.
6. **Outcome claim** — use of the asset contributed to a real-world result.

Passing one layer does not prove the next. In particular, a valid `.kdna` file
does not prove adherence, improvement, truth, expertise, or outcome value.

## Prompt, Skill, and KDNA controls

Judgment content may already exist in a Prompt, Skill, Policy, RAG corpus, or
model. A fair test must say what each condition receives.

Useful comparisons include:

- application baseline with no equivalent judgment;
- best Prompt carrying equivalent judgment;
- Skill or Policy carrying equivalent judgment;
- the same content delivered through a `.kdna` Runtime Capsule;
- alternate assets expressing different judgment systems.

If an equivalent Prompt and `.kdna` produce the same behavior, that is a valid
result. It suggests that the content, rather than the carrier, drove the
behavior. KDNA may still add asset identity, integrity, authorization,
projection, replacement, and rollback value.

## Required evaluation coordinates

Every published result should record:

- evaluator and evaluation purpose;
- exact asset identity, version, and digest;
- exact model, Host, Prompt, Skill, tool, and runtime coordinates;
- task and population scope;
- control conditions and sampling method;
- rubric, scorer, and disagreement handling;
- time, raw evidence location, and known limitations.

Different evaluators may legitimately reach different conclusions.

## Example method

For a bounded writing task:

1. Define the judgment claim and rubric before generation.
2. Freeze the exact source material and model settings.
3. Run a no-equivalent-judgment baseline, an equivalent-Prompt control, and the
   `.kdna` condition.
4. Verify the KDNA condition's asset digest, LoadPlan, and Capsule separately
   from the output score.
5. Blind the output order where possible.
6. Preserve failures and null results, not only wins.
7. Report behavioral findings as evaluator-scoped evidence, not intrinsic asset
   metadata.

## What Core may report

Core may report technical facts such as schema validity, checksums, signature
verification, authorization state, compatibility, projection, and receipt
coordinates. It must not turn an evaluator's score into built-in “good,”
“expert,” “safe,” “high quality,” or “recommended” status.

External catalogs and products may publish such assessments under their own
identity, method, scope, and evidence.
