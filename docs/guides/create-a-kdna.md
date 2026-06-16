# Create a KDNA Asset

> **Status: Phase 1 placeholder.**

This guide will walk through creating a `.kdna` file from a judgment specification. Phase 1 ships only the minimal reference example at [`examples/minimal/`](../../examples/minimal/); a full authoring walkthrough is reserved for a later phase.

For now, the canonical structure is:

```
my-asset/
├── mimetype
├── kdna.json
├── payload.kdnab
└── checksums.json
```

See [`docs/core/file-format.md`](../core/file-format.md) for the container rules and [`docs/core/manifest.md`](../core/manifest.md) for the manifest fields.
