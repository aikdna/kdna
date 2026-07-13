# KDNA Dev Source Directory

**Status:** Authoring input; not a distribution format

A Studio-compatible authoring tool may use a source directory containing
human-editable files such as:

```text
kdna.json
KDNA_Core.json
KDNA_Patterns.json
KDNA_Scenarios.json   (optional)
KDNA_Cases.json       (optional)
KDNA_Reasoning.json   (optional)
KDNA_Evolution.json   (optional)
```

This directory exists for editing, review, diffing, and migration. It is not an
installed KDNA asset and MUST NOT be distributed by merely zipping these files.

The source manifest uses `kdna_version: "1.0"`; removed top-level
`format_version`, `spec_version`, and `kdna_spec` fields MUST NOT be emitted.
Authoring tools may record provenance, optional Human Lock records, and build
metadata, but none of those records is permission to create an asset or a claim
that the judgment is true or good.

The only user-facing export is the
[KDNA Asset Container](./container.md):

```text
mimetype
kdna.json
payload.kdnab
checksums.json   (emitted by official writers)
```

Use a Studio-compatible exporter for normal creation and migration. `kdna dev`
commands are explicit diagnostics and do not convert a source directory into a
second canonical asset form.
