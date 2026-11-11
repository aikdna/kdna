<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-11-11).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.10` | `latest` | `29a2500cabfc0cd18e346d6ccfe554944b32eb7d4ef1d07668f0daf7518e4006` |
| `@aikdna/kdna-read` | `0.13.4` | `latest` | `edc3a2eaa2d1a70289cf43bdfa75155f8f0c4913cc9b7f20ea7a681d8f08bde0` |
| `@aikdna/kdna-cli` | `0.43.4` | `latest` | `f5e3f5812f153fedb200c73c8031dc3bf0ae526f870ea1860871105a2b8df527` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

MCP remains a Git source channel and adds no npm coordinate in this wave.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
