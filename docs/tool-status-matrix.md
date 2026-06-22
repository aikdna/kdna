# KDNA Tool Status Matrix — June 2026

## v1 Core GA (stable)

| Tool | Role | Status | Command |
|---|---|---|---|
| **kdna inspect** | v1 container inspection | GA | `kdna inspect <file.kdna>` |
| **kdna validate** | v1 format/schema/payload/checksum/load-contract validation | GA | `kdna validate <file.kdna>` |
| **kdna plan-load** | LoadPlan generation with entitlement diagnostics | GA | `kdna plan-load <file.kdna>` |
| **kdna load** | Runtime loading into agent-readable context | GA | `kdna load <file.kdna> --profile=compact --as=prompt` |
| **kdna pack** | Deterministic ZIP pack | GA | `kdna pack <dev-source> <out.kdna>` |
| **kdna unpack** | Container extraction | GA | `kdna unpack <file.kdna> <out>` |
| **kdna demo minimal** | Minimal v1 fixture creation | GA | `kdna demo minimal <dir>` |

Published: `@aikdna/kdna-cli@0.27.2`, `@aikdna/kdna-core@0.13.1`

## Studio (GA)

| Tool | Role | Status | Command |
|---|---|---|---|
| **kdna-studio create** | Studio project creation | GA | `kdna-studio create <dir> --name <name> [--author <name>]` |
| **kdna-studio card add** | Add judgment card (strict by default) | GA | `kdna-studio card add <project> axiom --field k=v ...` |
| **kdna-studio card approve** | Human Lock and approve cards | GA | `kdna-studio card approve <project> --all --by <id> --statement <text>` |
| **kdna-studio card update** | Update draft card fields | GA | `kdna-studio card update <project> <card-id> --field k=v` |
| **kdna-studio card remove** | Remove draft card | GA | `kdna-studio card remove <project> <card-id>` |
| **kdna-studio card unlock** | Reverse card approval | GA | `kdna-studio card unlock <project> <card-id> --by <id> --statement <text>` |
| **kdna-studio export** | v1 container export | GA | `kdna-studio export <project> --format v1 --out <file.kdna>` |

Published: `@aikdna/kdna-studio-cli@0.6.0`, `@aikdna/kdna-studio-core@1.5.8`

## Experimental / in development

| Tool | Status | Notes |
|---|---|---|
| **kdna-studio** (AI features) | experimental | distill, interview, feynman — requires LLM provider config |
| **kdna-vscode** | experimental | Not yet updated for v1 Core |
| **kdna-loader** | beta | Agent adapter skill; functional, UX hardening deferred |
| **kdna-core-swift** | beta | Swift runtime; JS parity not yet proven |

## Removed in v1 Core 0.27.0

The following legacy v0.7 command surfaces were removed in the hard cutover and are no longer available:

| Surface | Notes |
|---|---|
| `kdna help legacy` | Legacy help shim removed |
| `kdna setup` | Agent setup removed from CLI surface |
| `kdna install / remove / update / info` | Registry install removed |
| `kdna list / search` | Domain listing removed |
| `kdna registry` | Registry management removed |
| `kdna verify` | Legacy 3-layer verification removed |
| `kdna compare / diff` | Provider-key-dependent comparison removed |
| `kdna doctor / trace / history` | Diagnostics removed |
| `kdna publish` | Registry publish removed |
| `kdna identity` | Ed25519 key management removed from CLI |
| `kdna license` | License management removed |
| `kdna protect / unlock / recover` | Protected asset surface removed |
| `kdna workpack` | Work Pack CLI removed |
| `kdna cluster` | Cluster composition removed |
| `kdna governance / proposal / review / evolution / regression` | Governance surface removed |
| `kdna dev` | Dev source utilities removed (use v1 pack/validate/unpack directly) |

Future systems (distribution, signing, encryption, entitlement, remote runtime) may return through new RFCs and separate packages. They are not part of v1 Core GA.

## Deferred (future RFCs)

- Registry / asset discovery / distribution
- Signing / encryption / protected assets (RFC-0009)
- Entitlement / commercial authorization
- Remote runtime / hosted loading
- Work Pack assembly
- Quality badges and content ranking
