<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-12).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.2` | `latest` | `16234f84440252b0c449c529de71435630cc79816f88ff0d0a8a2b4d852c1274` |
| `@aikdna/kdna-read` | `0.11.3` | `latest` | `5fd1efc5bfd28ce8c9724fefb09c1abed35dde2c16f8498b572da5c640679f4c` |
| `@aikdna/kdna-cli` | `0.39.0` | `latest` | `436132276b96f5f3435f4883afce9805f1579d99f735d8c7e2fd1316482c06d0` |
| `@aikdna/kdna-studio-core` | `4.0.0` | `latest` | `062c35970e4c7e3ba49f8d9420f1e221a3ec007fac145d67c04fe5ee2e88be62` |
| `@aikdna/kdna-studio-cli` | `0.13.0` | `latest` | `8f1b0b8109d03c1678339f90fbf3c63ef20c4eb190004f0d4b8aabfff198415a` |

MCP remains a Git source channel (main `48fbdb4308b0fe6c2f7598795084a375ef17b90c`) and adds no
npm coordinate in this wave. Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
