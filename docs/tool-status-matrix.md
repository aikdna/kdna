# KDNA Tool Status Matrix — June 2026

| Tool | Role | Status | Can run today | Command | Known limitation | Next action |
|---|---|---|---|---|---|---|
| **kdna inspect** | Official v1 inspection | available in global CLI (@0.25.0) | yes | `kdna inspect <path>` | | |
| **kdna validate** | Official v1 validation | available in global CLI (@0.25.0) | yes | `kdna validate <path>` | | |
| **kdna pack** | Official deterministic pack | available in global CLI (@0.25.0) | yes | `kdna pack <src> <out>` | | |
| **kdna unpack** | Official unpack | available in global CLI (@0.25.0) | yes | `kdna unpack <in> <out>` | | |
| **kdna setup** | Agent setup | beta | yes | `kdna setup` (global) | Legacy agent adapter; v1 not wired | Update loader for v1 |
| **kdna doctor** | System health check | beta | yes | `kdna doctor --agents` (global) | Legacy CLI surface | Update for v1 |
| **kdna list** | Installed domains | beta | yes | `kdna list` (global) | Shows legacy v2 domain list | Update for v1 |
| **kdna install** | Asset install | legacy | partial | `kdna install <name>` (global) | Depends on legacy registry | Add local-path install |
| **kdna verify** | Structure verification | beta | yes | `kdna verify <name>` (global) | Legacy v2 verify pipeline | Update for v1 schema |
| **kdna load** | Runtime loading | beta | yes | `kdna load <name>` (global) | Legacy loader | Update for v1 load-contract |
| **kdna compare** | Demo comparison | beta | partial | `kdna compare <name> --input "..."` (global) | Requires provider API key | Document key requirement |
| **kdna-studio-cli** | Authoring CLI | legacy | partial | `kdna-studio create <name>` | Legacy Studio-compatible pipeline, not v1 Core | Re-author for v1 |
| **kdna-loader** | Agent adapter | beta | partial | setup-installed | Legacy skill, agent support varies by platform | Update for v1 trace vocabulary |
| **kdna-vscode** | VS Code extension | legacy | partial | VS Code marketplace | Legacy workspace tools; not canonical asset creator | Re-author for v1 |
| **kdna-core-swift** | Swift runtime | legacy | partial | SwiftPM | "KDNA Protocol" legacy framing in code | Re-author for v1 |
| **kdna-lab** | Pressure-test infra | experimental | partial | scripts | Experimental infrastructure; not v1 Core surface | No change needed |
| **registry** | Registry | removed from active public surface | no | not applicable | KDNA Core v1 has no registry; use local v1 `.kdna` files | Keep archived references historical only |

## Current (try first)

| Tool | Command | Requires registry | Requires API key | Notes |
|---|---|---|---|---|
| demo minimal | `kdna demo minimal <dir>` | no | no | Creates a v1 fixture from the npm package |
| inspect | `kdna inspect <path>` | no | no | v1 source dir or .kdna container |
| validate | `kdna validate <path>` | no | no | schema + format + payload + checksums (digest verified) + load-contract |
| pack | `kdna pack <src> <out>` | no | no | Deterministic ZIP |
| unpack | `kdna unpack <in> <out>` | no | no | Extract .kdna container |

## Beta

| Tool | Command | Requires registry | Requires API key | Notes |
|---|---|---|---|---|
| setup | `kdna setup` | no | no | Agent detection and loader install |
| doctor | `kdna doctor --agents` | no | no | System health check |
| load | `kdna load <file> --as=prompt` | no | no | Current (v1 supported in kdna-cli@0.25.0) |
| compare | `kdna compare <name> --input "..."` | yes (legacy) | yes | Requires provider API key |
| kdna-studio | `kdna-studio migrate <dir> --format v1 --out <file.kdna>` | no | no | Authoring CLI; v1 export via @aikdna/kdna-core (beta) |
| kdna-loader | installed by setup | no | no | Agent adapter, beta |

## Legacy / experimental (not Core v1 first-run)

| Tool | Command | Notes |
|---|---|---|
| registry | `kdna install/remove/update/list/search` | Legacy compatibility surface only; not Core v1 active path |
| badge | `kdna badge compute` | Pre-v1 quality badge system |
| workpack | `kdna workpack ...` | Experimental workflow format |
| license | `kdna license ...` | Pre-v1 licensed asset flow |
| protect | `kdna protect/unlock/recover` | Pre-v1 protected asset flow (RFC-0009) |
