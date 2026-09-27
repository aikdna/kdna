# Protected source /1 — R2 binding 1

The base protected-source contract remains `kdna.protected-source/1`, version `1.0.0`.
Its current Schema is `urn:kdna:schema:protected-source:1.0.0:binding:r2:1`, at
[protected-source-r2-binding-1.schema.json](protected-source-r2-binding-1.schema.json).
The unique public source registers the complete R2 tuple and exact Core/Read package
versions in `protected_source.schema_binding`; this record participates in the normal
definition digest. New Core rejection diagnostics therefore retain their meaning
through the source observation API. The old [Schema](protected-source.schema.json)
retains its exact historical bytes and identity.

The binding does not introduce a new encryption, authorization or revision algorithm.
A descriptor, typed Schema, installed implementation and definition digest must agree.
Failed admission remains body-free. Source preview is semantic validation, not encrypted
output admission, and it carries the actual bound Core package version. Public functions
remain in `@aikdna/kdna-core/protected-source-node`; this document is not acceptance,
native-platform coverage or proof of an actual account.
