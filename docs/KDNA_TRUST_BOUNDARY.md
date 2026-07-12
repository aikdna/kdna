# KDNA Trust Boundary

KDNA encodes judgment, not objective truth.

A valid `.kdna` asset proves structural conformance and loadability. It does
not prove that the encoded judgment is universally correct, safe for every
context, professionally endorsed, or appropriate for a user's situation.

## Current Verification Layers

| Layer | Verifies | Does not verify |
|---|---|---|
| Format | The container has the required files and metadata | Whether the judgment is good |
| Schema | `kdna.json` and payload shape satisfy the current contract | Whether the author is an expert |
| Payload | The payload is parseable and loadable | Whether the payload should be used |
| Checksums | Declared digests match the current bytes | Author identity or content quality |
| Load contract | The asset can be rendered through supported profiles | Fitness for every context |

## Required Runtime Posture

- `valid` does not mean `true`.
- `checksums_valid` does not mean `expert-authored`.
- `loadable` does not mean `safe for this task`.
- `loaded by AI` does not transfer responsibility away from the human deployer.
- Future signature or encryption states must not be mapped to "recommended",
  "approved", or "safe" labels.

## Fitness for Purpose

Loaders, products, teams, and users should evaluate:

- intended use
- out-of-scope situations
- known failure modes
- local risk tolerance
- required human review triggers
- legal, organizational, and professional constraints

KDNA helps AI systems apply explicit human judgment. It does not replace human
accountability.
