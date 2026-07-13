# `.kdna` File Format

This filename is retained as a compatibility link for older documentation.
The current and only distribution-format specification is
[`container.md`](./container.md).

In short:

- a `.kdna` distribution asset contains `mimetype`, `kdna.json`, and
  `payload.kdnab`;
- `checksums.json` is optional in the protocol and emitted by official writers;
- `payload.kdnab` is CBOR, or a CBOR encrypted envelope when declared encrypted;
- source-tree JSON files are authoring inputs and are forbidden as top-level
  distribution entries;
- Agents consume the Runtime Capsule returned by Core, never unpacked files.

There is no second current container format.
