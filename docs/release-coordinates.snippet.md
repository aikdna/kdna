<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-10-19).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.9` | `latest` | `084afc94fb808a4327995d6d47be8262d53e339e415db2879ff334d5d742362b` |
| `@aikdna/kdna-read` | `0.13.3` | `latest` | `52f5b05f4565e623af6e7a381d90ae2c75ef04edc82e2db2b88f7aa8d6ac0f50` |
| `@aikdna/kdna-cli` | `0.43.2` | `latest` | `51a126b877c5effc7a1bc44a78984e5a115c8fff2bba6418c7a391c8bdd314c9` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

MCP remains a Git source channel and adds no npm coordinate in this wave.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
