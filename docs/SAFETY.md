# KDNA Safety Framework

> ⚠️ **Historical snapshot.** This document describes the pre-v1 KDNA safety framework (Human Lock / quality gates / registry review / R0-R3 risk levels) and is out of scope for KDNA Core v1. KDNA Core v1 is the official KDNA judgment-asset format and runtime loading contract. Runtime safety is defined by the official KDNA toolchain's trace vocabulary (version_incompatible, failed_to_parse, failed_to_decrypt, signature_invalid, blocked_by_runtime_policy) and by caller-owned runtime policy. Current docs: README.md, docs/core/definition.md, docs/core/principles.md.

KDNA is not an execution tool, but it can influence agent judgment.
Judgment influences behavior. Behavior has consequences.

This document defines the safety baseline for the KDNA ecosystem.

## Design Principles

### 1. Judgment ≠ Authorization

Loading a KDNA domain gives the agent a judgment lens. It does NOT grant the agent new permissions, tool access, or execution authority.

### 2. Human Lock as Safety Gate

Every judgment card entering a compiled KDNA domain must pass Human Lock — a deliberate, per-card confirmation by the human author. This is not a checkbox. It is the primary safety mechanism preventing AI-generated judgment from entering the ecosystem unchecked.

### 3. Quality Gates Prevent Low-Quality Judgment

KDNA Studio Core enforces quality gates that block domains from reaching publishable status if they have:
- Vague or untestable axioms
- Missing applicability boundaries (applies_when / does_not_apply_when)
- Undeclared failure risks
- Straw-man misunderstandings
- Generic self-checks
- Missing Feynman restatements (at publishable grade)

### 4. Risk Level Declaration Is Mandatory

Every domain entering the registry MUST declare its risk level (R0–R3). High-risk domains (R2–R3) require additional review and carry stronger warnings.

### 5. Provenance Is Required

Every .kdna container SHOULD carry provenance metadata: who created it, with which tool, from which evidence, when, and with which content fingerprint. Unsigned `.kdna` files can still be valid at the format layer, but they must be presented as unsigned and unevaluated unless separate evidence says otherwise.

## High-Risk Domain Policy

Domains in the following categories are classified as R2 (High) or R3 (Restricted):

- Medical diagnosis or treatment recommendation
- Legal advice or interpretation
- Investment, financial, or insurance advice
- Mental health crisis intervention
- Child safety or education decisions
- Employment, hiring, or termination decisions
- Surveillance or monitoring systems
- Weapons-related systems
- Political manipulation or disinformation
- Public safety or emergency response

R3 domains are NOT permitted in the public registry without explicit maintainer review.

R2 domains require:
- Expert review by a qualified domain expert
- Stronger warnings in the domain README
- Explicit known_limitations
- Evidence coverage for all core axioms

## Safe Loading Rules

When an agent loads a KDNA domain:

1. **Check risk level** — High-risk domains should not be silently loaded
2. **Check signature** — Unsigned domains should trigger a warning
3. **Check yank status** — Yanked domains must be rejected
4. **Respect priority** — System safety policy > user intent > KDNA judgment
5. **Log loading** — Record what was loaded, why, and what was triggered
6. **Allow override** — Users must be able to reject KDNA judgment for a specific task

## Reporting a Safety Issue

If you discover a KDNA domain that:
- Produces harmful or dangerous judgment
- Violates intended use boundaries
- Contains misleading or fraudulent claims
- Bypasses Human Lock enforcement
- Has forged provenance

Report it by opening an issue in [aikdna/<historical>](https://github.com/aikdna/<historical>/issues) with the tag `safety`.

For security vulnerabilities in tooling, see [SECURITY.md](./SECURITY.md).
