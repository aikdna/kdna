<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-18).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.8` | `latest` | `4b7f27f46a000e199578fd191716eef3b34aaa41890e59a8ea4945d468d75bd7` |
| `@aikdna/kdna-read` | `0.13.2` | `latest` | `623f67f8643da6e158de2ae6063a5a9988e79e431eb1c548803c94a78e677688` |
| `@aikdna/kdna-cli` | `0.43.1` | `latest` | `2f9270073748d6b64439fc7354fe84ab7f246aaf85d6089bb6044a1ed05b7258` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

MCP remains a Git source channel and adds no npm coordinate in this wave.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
