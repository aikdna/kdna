<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->

**Current publication state (2026-11-18).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | `latest` | `affd3db862a02daaacd9ada91ec365ff93d9f6c2592e62df9e01888d36bb2e4a` |
| `@aikdna/kdna-read` | `0.13.5` | `latest` | `a7eb0064ad028a73394a4cc9d189dd22f52f046e30a31c6e50bea1490915fc89` |
| `@aikdna/kdna-cli` | `0.44.0` | `latest` | `382cb0fc07935333a2671e28d0ce2af6cd723896dd14ea6e3e2fec79d7608636` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

Agent Skills (`aikdna/kdna-skills`) are delivered from Git, alongside the optional local stdio MCP adapter coordinate recorded in the matrix.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
