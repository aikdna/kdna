# @aikdna/kdna

A historical compatibility package preserving `kdna-lint` and `kdna-validate` executable names. It is outside the native CLI source candidate's supported dependency graph and does not automatically migrate to current CLI/Core exports.

| Coordinate | CLI | Core | Node |
| --- | --- | --- | --- |
| Published npm `@aikdna/kdna@0.14.0` | `0.36.1` | `0.21.0` | `>=20` |
| Current Git source, still marked `0.14.0` | `0.36.1` | `0.22.0` | `>=22` |

The source metadata differs from the immutable published `0.14.0` artifact. It must not overwrite that version. The executables retain the earlier loading/validation behavior, including a historical private CLI entry dependency; changing dependency numbers alone cannot turn them into a native migration bridge.

Existing users who require that historical graph can pin its published coordinate:

```sh
npm install @aikdna/kdna@0.14.0
```

New integrations should use the native `@aikdna/kdna-cli@0.39.0-rc.native-sections.3` **source candidate**, with its exact Core/Read companions and complete source installation instructions in the [CLI repository](https://github.com/aikdna/kdna-cli). This statement does not claim that the prerelease is available from npm. The alias package does not resolve to it or add a second native runtime path. A compatibility bridge would require an explicit implementation, new version and real consumer verification.

Format validity and technical checks do not establish content quality, authorship, human confirmation, Creation acceptance or action authorization. See [auxiliary support boundaries](../AUXILIARY-SUPPORT.md).
