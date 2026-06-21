# KDNA Tool Status Matrix — June 2026

| Tool | Role | Status | Can run today | Command | Known limitation | Next action |
|---|---|---|---|---|---|---|
| **kdna inspect** | Official v1 inspection | available in global CLI (@0.26.9) | yes | `kdna inspect <file.kdna>` | | |
| **kdna validate** | Official v1 validation | available in global CLI (@0.26.9) | yes | `kdna validate <file.kdna>` | | |
| **kdna plan-load** | Official LoadPlan check | available in global CLI (@0.26.9) | yes | `kdna plan-load <file.kdna>` | | |
| **kdna load** | Runtime loading | available in global CLI (@0.26.9) | yes | `kdna load <file.kdna> --profile=compact --as=prompt` | | |
| **kdna pack** | Official deterministic pack | available in global CLI (@0.26.9) | yes | `kdna pack <dev-source> <out.kdna>` | Creator/debug workflow, not public consumption | |
| **kdna unpack** | Official unpack | available in global CLI (@0.26.9) | yes | `kdna unpack <file.kdna> <out>` | Editing/debug view, not a separate public asset | |
| **kdna setup** | Agent setup | beta | yes | `kdna setup` (global) | Agent-specific install behavior varies | Harden per-agent setup smokes |
| **kdna doctor** | System health check | beta | yes | `kdna doctor --agents` (global) | Agent-specific detection varies | Harden per-agent diagnostics |
| **kdna list** | Installed domains | beta | yes | `kdna list` (global) | Shows legacy v2 domain list | Update for v1 |
| **kdna install** | Asset install | legacy | partial | `kdna install <name>` (global) | Not part of the current local packaged `.kdna` path | Re-author for local packaged assets |
| **kdna verify** | Structure verification | beta | yes | `kdna verify <name>` (global) | Legacy v2 verify pipeline | Update for v1 schema |
| **kdna compare** | Demo comparison | beta | partial | `kdna compare <name> --input "..."` (global) | Requires provider API key | Document key requirement |
| **kdna-studio-cli** | Authoring CLI | beta | yes | `kdna-studio export <project> --format v1 --out <file.kdna>` | Authoring UX is still CLI-first | Keep user-path smokes green |
| **kdna-loader** | Agent adapter | beta | yes | setup-installed | Agent support varies by platform | Keep v1 local asset examples current |
| **kdna-vscode** | VS Code extension | legacy | partial | VS Code extension page | Legacy workspace tools; not canonical asset creator | Re-author for v1 |
| **kdna-core-swift** | Swift runtime | beta | partial | SwiftPM | Complete JS parity is not claimed until fixed Core v1 conformance fixtures prove it | Keep conformance fixtures pinned |
| **kdna-lab** | Pressure-test infra | experimental | partial | scripts | Experimental infrastructure; not v1 Core surface | No change needed |

## Current (try first)

| Tool | Command | Works locally | Requires API key | Notes |
|---|---|---|---|---|
| demo minimal | `kdna demo minimal <dir>` | yes | no | Creates a v1 fixture from the npm package |
| inspect | `kdna inspect <file.kdna>` | yes | no | Inspect a packaged v1 `.kdna` file |
| validate | `kdna validate <file.kdna>` | yes | no | schema + format + payload + checksums (digest verified) + load-contract |
| plan-load | `kdna plan-load <file.kdna>` | yes | no | Decide whether the file can be loaded before context is emitted |
| load | `kdna load <file.kdna> --as=prompt` | yes | no | Render loadable public local `.kdna` files |
| pack | `kdna pack <dev-source> <out.kdna>` | yes | no | Creator/debug workflow |
| unpack | `kdna unpack <file.kdna> <out>` | yes | no | Editing/debug view of a packaged file |

## Beta

| Tool | Command | Works locally | Requires API key | Notes |
|---|---|---|---|---|
| setup | `kdna setup` | yes | no | Agent detection and loader install |
| doctor | `kdna doctor --agents` | yes | no | System health check |
| compare | `kdna compare <name> --input "..."` | partial | yes | Requires provider API key |
| kdna-studio | `kdna-studio export <project> --format v1 --out <file.kdna>` | yes | no | Authoring CLI; v1 export via @aikdna/kdna-core (beta) |
| kdna-loader | installed by setup | yes | no | Agent adapter, beta |

## Legacy / experimental (not Core v1 first-run)

| Tool | Command | Notes |
|---|---|---|
| install/search | `kdna install/remove/update/list/search` | Legacy compatibility surface only; not Core v1 active path |
| evidence labels | `kdna badge compute` | Pre-v1 label experiment |
| workpack | `kdna workpack ...` | Experimental workflow format |
| license | `kdna license ...` | Pre-v1 licensed asset flow |
| protect | `kdna protect/unlock/recover` | Pre-v1 protected asset flow (RFC-0009) |
