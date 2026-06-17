# KDNA Tool Status Matrix — June 2026

| Tool | Role | Status | Can run today | Command | Known limitation | Next action |
|---|---|---|---|---|---|---|
| **kdna inspect** | Official v1 inspection | beta (local-only) | yes | `node packages/kdna/bin/kdna.js inspect <path>` | Not in global CLI v0.21.1 | Publish v1-aware CLI |
| **kdna validate** | Official v1 validation | beta (local-only) | yes | `node packages/kdna/bin/kdna.js validate <path>` | Not in global CLI | Publish v1-aware CLI |
| **kdna pack** | Official deterministic pack | beta (local-only) | yes | `node packages/kdna/bin/kdna.js pack <src> <out>` | Not in global CLI | Publish v1-aware CLI |
| **kdna unpack** | Official unpack | beta (local-only) | yes | `node packages/kdna/bin/kdna.js unpack <in> <out>` | Not in global CLI | Publish v1-aware CLI |
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
| **kdna-registry** | Registry | legacy | no | not applicable | Marked as legacy experiment; KDNA Core v1 has no registry | Formal archival |
