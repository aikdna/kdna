# @aikdna/kdna

A historical compatibility package preserving `kdna-lint` and `kdna-validate` executable names. It is outside the current native CLI's supported dependency graph and does not automatically migrate to current CLI/Core exports.

| Coordinate | CLI | Core | Node |
| --- | --- | --- | --- |
| Published npm `@aikdna/kdna@0.14.0` | `0.36.1` | `0.21.0` | `>=20` |
| Current Git source, still marked `0.14.0` | `0.36.1` | `0.22.0` | `>=22` |

The source metadata differs from the immutable published `0.14.0` artifact. It must not overwrite that version. The executables retain the earlier loading/validation behavior, including a historical private CLI entry dependency; changing dependency numbers alone cannot turn them into a native migration bridge.

The README inside the immutable `0.14.0` tarball predates this correction and names the native CLI coordinate that was current when that artifact was packed. Those bytes cannot be changed in place; this file and the release-coordinate matrix supersede that sentence, and no same-version repackaging is intended.

Existing users who require that historical graph can pin its published coordinate:

```sh
npm install @aikdna/kdna@0.14.0
```

New integrations should use the native `@aikdna/kdna-cli` package with its exact Core/Read companions; the [CLI repository](https://github.com/aikdna/kdna-cli) and the [release-coordinate matrix](../../docs/release-coordinates.json) state the exact coordinates and the complete installation instructions. The alias package does not resolve to it or add a second native runtime path. A compatibility bridge would require an explicit implementation, new version and real consumer verification.

Format validity and technical checks do not establish content quality, authorship, human confirmation, Creation acceptance or action authorization. See [auxiliary support boundaries](../AUXILIARY-SUPPORT.md).
