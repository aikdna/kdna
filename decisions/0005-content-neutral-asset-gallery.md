# Decision 0005: Content-Neutral Asset Gallery

**Date**: 2026-06  
**Status**: Accepted

## Context

As `kdna-assets` grows (Decision 0004), a natural question arises: should KDNA validate
the *content* of `.kdna` files — their domain correctness, their ideological alignment,
their practical value — or only their *format*?

## Decision

KDNA validates only format, safety, and loadability:

- **Format**: Does the `.kdna` file conform to the schema?
- **Safety**: Does it contain executable or network-requesting constructs that violate
  the sandbox boundary?
- **Loadability**: Does `kdna plan-load` complete without errors?

KDNA does **not** validate, rate, or gate on:

- Content correctness (are the domain judgments accurate?)
- Value (is this asset useful?)
- Ideology (does this asset align with a particular viewpoint?)
- Quality (is this asset well-written?)

Users decide whether to load an asset. KDNA's job is to ensure it won't break the session.

## Rationale

KDNA is a format and a loader — not a content moderator, not a truth arbiter, and not a
curator. Validating content correctness would require KDNA to have domain expertise it
cannot possess: a `.kdna` file for medical triage needs a doctor's review, not a schema
check. Attempting to build content-level gates would either be so shallow as to be useless
or so deep as to require AGI.

Furthermore, content neutrality is a trust property. Users should know that KDNA will
load what they ask it to load, without silently refusing because an algorithm disagreed
with the content. Rejection is reserved for structural failure, not semantic disagreement.

Safety checks are the one exception: if a `.kdna` file attempts to make network calls
or execute code outside the sandbox, KDNA must reject it. This is structural, not content-based.

## Consequences

- `kdna validate` and `kdna plan-load` do not produce content-quality scores or ratings.
- No content policy beyond the safety sandbox exists.
- Users are responsible for content judgment. KDNA is responsible for structural integrity.
