<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-15).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.6` | `latest` | `17137ebdd316f5e44b64c6164d6fca07b0e8486b42b5eb6e85347d92ad25087f` |
| `@aikdna/kdna-read` | `0.13.0` | `latest` | `26f62bb703c7ad92acdfa02e44b3b981f73ec2e9c20bec29e1412937968170a7` |
| `@aikdna/kdna-cli` | `0.42.0` | `latest` | `8edc544208af12aa44e731a733aedc7ad6af0a4507e3d34ac6e5c5c5a1c08d00` |
| `@aikdna/kdna-studio-core` | `4.0.0` | `latest` | `062c35970e4c7e3ba49f8d9420f1e221a3ec007fac145d67c04fe5ee2e88be62` |
| `@aikdna/kdna-studio-cli` | `0.13.0` | `latest` | `8f1b0b8109d03c1678339f90fbf3c63ef20c4eb190004f0d4b8aabfff198415a` |

MCP remains a Git source channel (main `195be98b8e19c6173c60c06927b01a6930e1a90e`) and adds no
npm coordinate in this wave. Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
