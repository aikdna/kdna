# Human Lock Is Optional

This document defines the role and scope of Human Lock in KDNA assets.

## Core Principle

**Human Lock is an optional provenance and trust signal. It indicates that certain judgment content has been reviewed and confirmed by a human. It is NOT a format-validity requirement, a creation prerequisite, or a loading condition.**

## What Human Lock Is

Human Lock is a metadata record embedded in KDNA source files. It documents:

- **Who** reviewed the judgment content
- **When** the review occurred
- **What** was confirmed (the locked statement)
- **Which** judgment fields were checked (`applies_when`, `does_not_apply_when`, `failure_risk`)

## What Human Lock Is NOT

- ❌ **A creation requirement** — `.kdna` files can be created without Human Lock
- ❌ **A validity gate** — `kdna validate` does not require Human Lock
- ❌ **A loading condition** — runtimes MAY load unsigned, un-locked `.kdna` files
- ❌ **A trust guarantee** — Human Lock means a human reviewed it, not that it is correct

## When Human Lock Is Recommended

Human Lock is recommended for:

1. **Official reference assets** published for public consumption
2. **Enterprise policy domains** where accountability is required
3. **High-risk judgment domains** (medical, legal, financial, safety)
4. **Published assets** where the author wants to signal provenance

## When Human Lock Is NOT Required

Human Lock is not required for:

1. **Agent-created KDNA** for personal use
2. **Development and testing** assets
3. **Community experiments** and prototypes
4. **Internal team domains** where implicit trust exists
5. **Any `.kdna` file** that passes `kdna validate`

## Creation Without Human Lock

An agent or tool can create a valid `.kdna` file without any Human Lock records:

```bash
# Agent creates domain source files
agent generate-kdna --domain writing-style --output ./my-domain/

# Validate the result
kdna validate ./my-domain/

# Pack into .kdna file
kdna pack ./my-domain/ ./my-domain.kdna

# Load into agent
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

No Human Lock step is required in this flow.

## Human Lock in Studio

When using KDNA Studio, judgment-class cards (axiom, boundary, risk, aesthetic) can be locked by a human reviewer. The Studio quality gates can warn if judgment cards are unlocked, but this is a **quality recommendation**, not a format requirement.

## Trust Layering

Human Lock is one signal in a layered trust model:

```
Base:       Valid KDNA (format correctness)
Layer 1:    + Toolchain-created (provenance)
Layer 2:    + Human-confirmed (Human Lock)
Layer 3:    + Signed (cryptographic attestation)
Layer 4:    + Evaluated (scoring evidence)
Layer 5:    + Registry-listed (discovery)
```

Each layer is independent. A consumer decides which layers matter for their use case.
