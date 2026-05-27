# RFC-0005: Composition Policy

Status: draft

## Summary

Composition lets multiple KDNA assets contribute judgment to one task without
silently blending incompatible guidance.

## Normative Rules

- Composition MUST preserve source attribution.
- Conflicts MUST be surfaced, not silently resolved.
- Runtimes SHOULD support user-confirmed composition for multi-domain tasks.
- Token budget compression MUST preserve boundaries, failure risks, and
  self-checks before examples.

## Open Questions

- How should official priority policies be declared?
- Which conflict classes are machine-detectable enough for conformance tests?
