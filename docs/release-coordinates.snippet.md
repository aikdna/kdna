<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-13).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.3` | `latest` | `b4f3a6593b0fd55e8d245009835123578722f09fd71f6bc579b2e3b988a144f1` |
| `@aikdna/kdna-read` | `0.12.0` | `latest` | `c815b4df97cc0ce844b94295df3802bf7cc5a68056c3aca587efed90251b4cbb` |
| `@aikdna/kdna-cli` | `0.40.0` | `latest` | `0b2642c1e5141a8ba32f37aba04e9997dc5da7c7fc6dc9f0e43f673d5d1c1b17` |
| `@aikdna/kdna-studio-core` | `4.0.0` | `latest` | `062c35970e4c7e3ba49f8d9420f1e221a3ec007fac145d67c04fe5ee2e88be62` |
| `@aikdna/kdna-studio-cli` | `0.13.0` | `latest` | `8f1b0b8109d03c1678339f90fbf3c63ef20c4eb190004f0d4b8aabfff198415a` |

MCP remains a Git source channel (main `338f80e8ed86d2e5e99ac6c32dec5184dee46b2f`) and adds no
npm coordinate in this wave. Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
