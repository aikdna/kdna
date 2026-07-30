# Create a KDNA Asset

> **Status: Phase 1 placeholder.**

This guide will walk through creating a `.kdna` file from a judgment specification. Phase 1 ships only the minimal reference example at [`examples/minimal/`](../../examples/minimal/); a full authoring walkthrough is reserved for a later phase.

For now, the official Creation Writer structure is:

```
my-asset/
├── mimetype
├── kdna.json
├── payload.kdnab
└── checksums.json
```

Core requires only `mimetype`, `kdna.json`, and `payload.kdnab`;
`checksums.json` is optional at the protocol layer and required for the
official Creation Writer output profile.

See [`docs/core/file-format.md`](../core/file-format.md) for the container
rules, [`docs/core/manifest.md`](../core/manifest.md) for the manifest fields,
and [Creation Output Boundary](../../specs/creation-output-boundary.md) for the
separation between Core format validity and Creation Engine acceptance.
