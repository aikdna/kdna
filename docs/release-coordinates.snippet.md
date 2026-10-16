<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-16).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.7` | `latest` | `3dd7c560e86fd1fa6085d3162d781f33b797c73b27bce435a25bf8d997121560` |
| `@aikdna/kdna-read` | `0.13.1` | `latest` | `2d367c9c9105350ffa7a4aa180ab9dcf4487489a91e0f5b4f62853f736cc0899` |
| `@aikdna/kdna-cli` | `0.43.0` | `latest` | `ff1096beeeb74e7fd1097695f0e9ee74e59199d32109236821f99f8ed302ec22` |
| `@aikdna/kdna-studio-core` | `4.0.0` | `latest` | `062c35970e4c7e3ba49f8d9420f1e221a3ec007fac145d67c04fe5ee2e88be62` |
| `@aikdna/kdna-studio-cli` | `0.13.0` | `latest` | `8f1b0b8109d03c1678339f90fbf3c63ef20c4eb190004f0d4b8aabfff198415a` |

MCP remains a Git source channel and adds no npm coordinate in this wave.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
