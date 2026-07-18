# Start Here

**Judgment can live in many carriers. KDNA gives a selected judgment system a
portable asset and loading contract.**

KDNA is an open judgment-asset protocol. Anyone can create a `.kdna` asset;
compatible Agent consumption goes through the KDNA toolchain, authorization,
and Runtime Capsule contract.

In 5 minutes, you can generate a current demonstration asset, validate it, and
load its Runtime Capsule into an Agent context.

---

## What do you want to do?

| I want to... | Start here | Time |
|-------------|-----------|------|
| **See the current KDNA lifecycle** | [5-Minute Quick Start](#5-minute-quick-start) | 5 min |
| **Create my own KDNA** | [30-Minute Authoring Guide](./30-minute-authoring-guide.md) | 30 min |
| **Preserve personal judgment or preferences** | [Why KDNA](./why-kdna.md#whose-judgment) | 10 min |
| **Package professional expertise or creative taste** | [Why KDNA](./why-kdna.md#whose-judgment) | 10 min |
| **Build a team judgment asset** | [Enterprise Pilot](./enterprise-pilot.md) | 20 min |
| **Load KDNA into my AI agent** | [15-Minute Agent Guide](./15-minute-agent-guide.md) | 15 min |
| **Use multiple assets as a Cluster** | [Consumption Runtime](./consumption-runtime.md) | 20 min |
| **Evaluate an asset** | [Maturity and evidence](./maturity.md) | 10 min |
| **Understand the protocol** | [KDNA and the AI Stack](./kdna-and-ai-stack.md) | 15 min |
| **Contribute** | [CONTRIBUTING.md](../CONTRIBUTING.md) | 5 min |

---

## 5-Minute Quick Start

```bash
npm install -g @aikdna/kdna-cli

# Generate, package, validate, and load one current-format asset
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

Expected validation result:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

## Create your own asset

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain --name @yourscope/my-domain
kdna-studio card add my-domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when='["teaching KDNA to a new user"]' \
  --field does_not_apply_when='["only demonstrating CLI syntax"]' \
  --field failure_risk="Users may copy the format without preserving judgment." \
  --field confidence="high" \
  --field evidence_type="practice"
kdna-studio card approve my-domain --all --by your-id --statement "I confirm this judgment for export."
kdna-studio export my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

---

## What KDNA Is (and Isn't)

| KDNA makes first-class | KDNA does not claim |
|-------------------------|---------------------|
| A named, scoped judgment asset | That Prompt, Skill, RAG, Policy, or Memory cannot carry judgment |
| Format, identity, integrity, and version contracts | That asset content is true, good, or superior |
| LoadPlan, authorization, projection, and Capsule delivery | Tool permission or workflow execution authority |
| Cross-agent portability through a shared protocol | Guaranteed behavior improvement on every model or task |
| Optional provenance and lifecycle metadata | Ownership of all facts, methods, or reasoning |

Use KDNA when the judgment needs that independent asset contract. Keep using a
Prompt, Skill, document, Policy, or knowledge system when its own contract is
enough.

---

## Repository Map

KDNA Core is the **official KDNA judgment-asset format and runtime loading contract**. The following are the active official toolchain components:

| Repo | Role |
|------|------|
| [kdna](https://github.com/aikdna/kdna) | Official KDNA Core spec, toolchain entry, schemas, docs |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Official runtime CLI: inspect, validate, pack, unpack, load |
| [kdna-eval](https://github.com/aikdna/kdna/tree/main/packages/kdna-eval) | Replay, budget, and consumption-evaluation primitives |
| [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli) | Authoring CLI for creating and exporting `.kdna` assets |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Official agent loader adapter |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | Public reference-asset releases; technical examples, not content endorsements or the default onboarding path |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Apple-platform runtime with a current 0.20.0 conformance release |
| [kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Apple-platform authoring kernel; 0.4.0 remains the published release while current-runtime recertification is pending |
| [kdna-app-shared](https://github.com/aikdna/kdna-app-shared) | Shared Apple-app presentation infrastructure; 0.5.0 remains the published release while current-runtime recertification is pending |

---

## Current State

The current KDNA Asset Container and local public-asset path are in public beta
for packaged `.kdna` creation, validation, LoadPlan diagnostics, and loading.
See [Status](./status.md) for the stable / beta / experimental boundary.

A single KDNA asset is the foundation and default consumption path. A KDNA
Cluster is an explicit advanced path for coordinating multiple assets around a
task. The two paths coexist; Cluster does not replace the single-asset model.

For applications that need task-aware asset selection, start with the
[Consumption Runtime guide](./consumption-runtime.md). It explains route,
bounded composition, projections, traces, and evaluation without changing the
`.kdna` file format.

---

New to KDNA? This page is your entry. Everything else links back here.
