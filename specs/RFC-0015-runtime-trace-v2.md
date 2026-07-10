# RFC-0015: Runtime Trace v2 (Archived)

**Status:** Withdrawn — retained as an archive marker

This proposal was not adopted as a KDNA Core trace specification. It defines no
required trace fields, runtime behavior, or compatibility promise.

Use the maintained public interfaces instead:

- [Runtime trace documentation](../docs/kdna-trace.md) for the supported trace
  surface.
- [Judgment trace schema](./judgment-trace-schema.json) and
  [evidence trace schema](./evidence-trace.schema.json) for versioned data
  contracts.
- [Consumption runtime guide](../docs/consumption-runtime.md) for how traces
  fit into selection, projection, evaluation, and reviewed changes.

Any successor proposal must be independently reproducible, identify a concrete
schema version, and distinguish optional diagnostic metadata from the canonical
`.kdna` asset protocol.
