# KDNA Public Status

English | [简体中文](./status.zh.md)

## Active Release Line (Container `0.6.0`)

The current production line uses **Container `0.6.0`**, **Judgment Payload `0.5.1`**, and **Selective Read `0.7.0-candidate`**. All core packages below are published on npm `latest` and verified byte-for-byte in [`release-coordinates.json`](./release-coordinates.json):

| Component | Current Version | Role |
| --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | Container `0.6.0` & `0.5.0` validation, Canonical IR, digests, packing, and RFC-0018 local password encryption |
| `@aikdna/kdna-read` | `0.13.5` | Selective Read protocol (`catalog`, `exact_selection` with mandatory closure, `expand`, and password unlock) |
| `@aikdna/kdna-cli` | `0.45.0` | Official CLI (`init`, `validate-input`, `create`, `protect`, `unprotect`, `inspect`, `validate`, `read`, `diff`, `source-open`, `source-pack`, `convert`) |
| `aikdna/kdna-skills` | `main` (`@aikdna/kdna-mcp-server@0.8.1`) | Agent Skills (`kdna-creator`, `kdna-loader`) and optional local stdio MCP adapter |
| `aikdna/kdna-assets` | *KDNA Whitepaper* `v1.0.2` (`zh-CN` & `en`) | Official public `.kdna` works (`CC BY 4.0`) |
| **KDNA Reader** | macOS Desktop App (Apple Silicon) | Free, Apple-notarized desktop reader for reading local `.kdna` files and browsing the Judgment Asset Library |

Everything in the core loop—creating, validating, encrypting with a local passphrase (`kdna protect`), selectively reading, diffing, and reading locally in KDNA Reader—is **permanently account-free** and works offline.

## Archived Legacy Lines

- **Container `0.5.0` (Studio session line)**: `@aikdna/kdna-studio-cli@0.14.0` and `@aikdna/kdna-studio-core@4.1.0` remain preserved for existing `0.5.0` projects. For new works, use `@aikdna/kdna-cli@0.45.0` (see [`migration-checklist.md`](./migration-checklist.md)).
- **Container `0.1.0` (`CLI 0.36.1`)**: Historical `plan-load` / `load` / `Runtime Capsule` commands are retired and replaced by `inspect` → `validate` → `read` in `0.45.0`.

## Further Reading

- [Start Here](./start-here.md) · [Maturity](./maturity.md) · [Current Release Support](./current-release-support.md) · [Public Roadmap](./public-roadmap.md)
