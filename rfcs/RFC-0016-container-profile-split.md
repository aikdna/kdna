# RFC-0016: Container Spec and Judgment Profile Split

Status: Draft Normative

## Summary

KDNA Core currently defines both:

- the `.kdna` container contract; and
- the default judgment payload shape used by current tools.

These two layers must remain compatible but should be specified separately. The
container must stay stable across judgment domains, while payload profiles must
be able to evolve for fields such as law, medicine, design, code review,
education, safety, and organization policy.

## Motivation

The container answers: can a runtime safely inspect, verify, plan, and load this
file?

The judgment profile answers: how should this payload represent judgment?

Keeping both in one normative surface makes the current Judgment Profile v1 look
like the only possible KDNA shape. That limits future domain-specific profiles
and invites tools to treat profile-specific fields as container validity rules.

## Proposed Split

### KDNA Container Spec

The container spec owns:

- `.kdna` ZIP/container layout;
- `mimetype`;
- `kdna.json` manifest;
- payload location and encoding metadata;
- checksums and digest rules;
- optional signature metadata;
- optional encryption and entitlement metadata;
- LoadPlan states and refusal rules;
- safe container parsing requirements;
- install and local package index behavior.

### KDNA Judgment Profile v1

Judgment Profile v1 owns:

- axioms;
- applicability boundaries;
- negative boundaries;
- failure risks;
- patterns and misunderstandings;
- scenarios and cases;
- reasoning;
- evolution/history;
- self-checks;
- compact/scenario/full projection semantics.

## Compatibility Rules

- A `.kdna` file is format-valid when it satisfies the container spec and its
  declared payload profile schema.
- Judgment Profile v1 remains the default profile for current KDNA Core tooling.
- Future profiles must declare their profile id in manifest compatibility or
  load-contract metadata.
- Loaders must reject unknown mandatory profile semantics before payload
  projection, but may still inspect manifest metadata.
- Human Lock, registry listing, signatures, and official-toolchain provenance
  are trust signals or policy gates, not universal container validity
  requirements.

## Migration Plan

1. Extract container-only normative text from `SPEC.md`.
2. Extract Judgment Profile v1 normative text from current domain structure and
   projection sections.
3. Add profile id validation to fixtures and conformance tests.
4. Update Studio Core and CLI docs to say they emit Judgment Profile v1 rather
   than "the" KDNA structure.
5. Add profile-aware conformance fixtures for at least one non-default draft
   profile before making the split Stable.

## Non-Goals

- This RFC does not change KDNA Core runtime behavior today.
- This RFC does not add a new payload profile.
- This RFC does not weaken LoadPlan, checksum, or safe-container requirements.

## Acceptance Criteria

- Container conformance can be tested without asserting profile-specific axiom
  fields.
- Judgment Profile v1 conformance can be tested independently of ZIP/container
  mechanics.
- Public docs no longer describe the current Judgment Profile v1 structure as
  the sole possible KDNA payload shape.
- Existing public, local `.kdna` assets remain valid.
